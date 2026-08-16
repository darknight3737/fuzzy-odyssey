import {
  type ExecFileOptions,
  type ExecFileSyncOptions,
  type SpawnOptions,
  execFile,
  execFileSync,
  spawn,
} from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const rawExecFileAsync = promisify(execFile);

export const IS_WINDOWS = platform() === 'win32';

/**
 * Cross-platform execFile.
 *
 * On Windows only `.cmd` / `.bat` shims (pnpm, npm, the `node_modules/.bin`
 * entries) need `cmd.exe`; native executables (node, git, docker) are spawned
 * directly so Node keeps escaping their arguments.
 */
export function execFileAsync(
  command: string,
  args: string[],
  options: ExecFileOptions = {},
) {
  const invocation = buildInvocation(command, args);

  return rawExecFileAsync(invocation.command, invocation.args, {
    ...options,
    ...invocation.options,
  });
}

/**
 * Cross-platform execFileSync.
 */
export function crossExecFileSync(
  command: string,
  args: string[],
  options: ExecFileSyncOptions = {},
) {
  const invocation = buildInvocation(command, args);

  return execFileSync(invocation.command, invocation.args, {
    ...options,
    ...invocation.options,
  });
}

/**
 * Spawn a long-running detached process.
 *
 * - **Unix**: uses `detached: true` so the child becomes a process-group
 *   leader (allows group-kill via negative PID).
 * - **Windows**: omits `detached` to avoid opening a visible console window.
 *   The child stays alive as long as the MCP-server process does.
 */
export function spawnDetached(
  command: string,
  args: string[],
  options: SpawnOptions = {},
) {
  const invocation = buildInvocation(command, args);

  const child = spawn(invocation.command, invocation.args, {
    ...options,
    ...invocation.options,
    detached: !IS_WINDOWS,
    stdio: 'ignore',
  });

  child.unref();

  return child;
}

/**
 * Kill a process (and its tree on Windows).
 *
 * - **Unix**: kills the process group via `process.kill(-pid)`, falling back
 *   to the individual process.
 * - **Windows**: uses `taskkill /T /F /PID` which terminates the whole tree.
 */
export async function killProcess(
  pid: number,
  signal: string = 'SIGTERM',
): Promise<void> {
  if (IS_WINDOWS) {
    try {
      await rawExecFileAsync('taskkill', ['/T', '/F', '/PID', String(pid)], {
        windowsHide: true,
      });
    } catch {
      // Process may already be dead.
    }

    return;
  }

  try {
    process.kill(-pid, signal);
  } catch {
    try {
      process.kill(pid, signal);
    } catch {
      // Process may already be dead.
    }
  }
}

/**
 * Find which process is listening on a TCP port.
 *
 * - **Unix**: parses `lsof` output.
 * - **Windows**: parses `netstat -ano` output.
 */
export async function getPortProcess(
  port: number,
  cwd: string,
): Promise<{ pid: number; command: string } | null> {
  try {
    if (IS_WINDOWS) {
      return await getPortProcessWindows(port, cwd);
    }

    return await getPortProcessUnix(port, cwd);
  } catch {
    return null;
  }
}

/**
 * Find running processes whose command line matches a pattern.
 *
 * - **Unix**: uses `pgrep -fl`.
 * - **Windows**: uses PowerShell `Get-CimInstance Win32_Process`.
 */
export async function findProcessesByName(
  pattern: string,
  cwd: string,
): Promise<Array<{ pid: number; command: string }>> {
  try {
    if (IS_WINDOWS) {
      return await findProcessesByNameWindows(pattern, cwd);
    }

    return await findProcessesByNameUnix(pattern, cwd);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Windows command resolution
// ---------------------------------------------------------------------------

const resolvedCommands = new Map<string, string>();

/**
 * Decide how to invoke a command on the current platform.
 *
 * `shell: true` combined with an args array performs **no** escaping (see
 * DEP0190), so quotes, parens and `%` in arguments get mangled. Instead we
 * resolve the command against PATH/PATHEXT and only build a `cmd.exe` command
 * line — escaped by hand — for the `.cmd`/`.bat` shims that genuinely require
 * one.
 */
function buildInvocation(command: string, args: string[]) {
  if (!IS_WINDOWS) {
    return { command, args, options: {} };
  }

  const resolved = resolveWindowsCommand(command);

  if (!isBatchFile(resolved)) {
    return { command: resolved, args, options: { windowsHide: true } };
  }

  const commandLine = [
    escapeWindowsCommand(resolved),
    // `.cmd`/`.bat` files are parsed twice by cmd.exe, so meta characters need
    // to survive one extra round of unescaping.
    ...args.map((arg) => escapeWindowsArgument(arg, true)),
  ].join(' ');

  return {
    command: process.env.comspec ?? 'cmd.exe',
    args: ['/d', '/s', '/c', `"${commandLine}"`],
    options: { windowsHide: true, windowsVerbatimArguments: true },
  };
}

function resolveWindowsCommand(command: string) {
  const cached = resolvedCommands.get(command);

  if (cached !== undefined) {
    return cached;
  }

  const resolved = lookupWindowsCommand(command);

  // Misses are not cached: a CLI installed after the server started should be
  // picked up on the next call rather than staying unresolved for the session.
  if (resolved) {
    resolvedCommands.set(command, resolved);
  }

  return resolved ?? command;
}

/**
 * Locate the file a Windows command actually points at.
 *
 * Handles the two shapes used in this package: a bare name looked up on PATH
 * (`pnpm`), and an extensionless path to a workspace bin (`node_modules/.bin/
 * supabase`) whose real file carries a PATHEXT extension.
 */
function lookupWindowsCommand(command: string) {
  const extensions = (process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD')
    .split(';')
    .map((extension) => extension.trim())
    .filter(Boolean);

  const probe = (candidate: string) => {
    if (path.extname(candidate) && existsSync(candidate)) {
      return candidate;
    }

    for (const extension of extensions) {
      const withExtension = candidate + extension;

      if (existsSync(withExtension)) {
        return withExtension;
      }
    }

    return null;
  };

  if (command.includes('/') || command.includes('\\')) {
    return probe(command);
  }

  const searchPath = process.env.PATH ?? process.env.Path ?? '';

  for (const dir of searchPath.split(path.delimiter).filter(Boolean)) {
    const found = probe(path.join(dir, command));

    if (found) {
      return found;
    }
  }

  return null;
}

function isBatchFile(file: string) {
  return /\.(cmd|bat)$/i.test(file);
}

// Meta characters cmd.exe acts on. Escaping algorithm below follows
// cross-spawn / https://qntm.org/cmd.
const CMD_META_CHARS = /([()\][%!^"`<>&|;, *?])/g;

function escapeWindowsCommand(command: string) {
  return command.replace(CMD_META_CHARS, '^$1');
}

function escapeWindowsArgument(
  argument: string,
  doubleEscapeMetaChars = false,
) {
  // Backslashes preceding a double quote are doubled, and the quote escaped.
  let escaped = argument.replace(/(\\*)"/g, '$1$1\\"');

  // Backslashes at the end would otherwise escape the closing quote we add.
  escaped = escaped.replace(/(\\*)$/, '$1$1');

  escaped = `"${escaped}"`;
  escaped = escaped.replace(CMD_META_CHARS, '^$1');

  if (doubleEscapeMetaChars) {
    escaped = escaped.replace(CMD_META_CHARS, '^$1');
  }

  return escaped;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getPortProcessUnix(port: number, cwd: string) {
  const result = await rawExecFileAsync(
    'lsof',
    ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fpc'],
    { cwd },
  );

  const lines = result.stdout.split('\n').map((l) => l.trim());
  const pidLine = lines.find((l) => l.startsWith('p'));
  const commandLine = lines.find((l) => l.startsWith('c'));

  if (!pidLine || !commandLine) return null;

  const pid = Number(pidLine.slice(1));

  if (!Number.isFinite(pid)) return null;

  return { pid, command: commandLine.slice(1) };
}

async function getPortProcessWindows(port: number, cwd: string) {
  const result = await rawExecFileAsync('netstat', ['-ano'], {
    cwd,
    windowsHide: true,
  });

  const portStr = `:${port}`;

  for (const line of result.stdout.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed.includes('LISTENING')) continue;
    if (!trimmed.includes(portStr)) continue;

    // Netstat format: TCP  0.0.0.0:PORT  0.0.0.0:0  LISTENING  PID
    const parts = trimmed.split(/\s+/);
    const pid = Number(parts[parts.length - 1]);

    if (!Number.isFinite(pid) || pid === 0) continue;

    // Verify the port column actually matches (avoid partial matches)
    const localAddr = parts[1] ?? '';

    if (localAddr.endsWith(portStr)) {
      return { pid, command: 'unknown' };
    }
  }

  return null;
}

async function findProcessesByNameUnix(pattern: string, cwd: string) {
  const result = await rawExecFileAsync('pgrep', ['-fl', pattern], { cwd });

  return parseProcessLines(result.stdout);
}

async function findProcessesByNameWindows(pattern: string, cwd: string) {
  // The pattern travels in an environment variable rather than inside the
  // script: embedding it would make the PowerShell process's own command line
  // match the Win32_Process query it is running.
  const psCommand = [
    `Get-CimInstance Win32_Process`,
    `| Where-Object { $_.CommandLine -match $env:MK_PROCESS_PATTERN }`,
    `| ForEach-Object { "$($_.ProcessId) $($_.CommandLine)" }`,
  ].join(' ');

  const result = await rawExecFileAsync(
    'powershell',
    ['-NoProfile', '-Command', psCommand],
    {
      cwd,
      windowsHide: true,
      env: { ...process.env, MK_PROCESS_PATTERN: pattern },
    },
  );

  return parseProcessLines(result.stdout);
}

function parseProcessLines(stdout: string) {
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const trimmed = line.trim();
      const spaceIdx = trimmed.indexOf(' ');

      if (spaceIdx <= 0) return null;

      const pid = Number(trimmed.slice(0, spaceIdx));
      const command = trimmed.slice(spaceIdx + 1).trim();

      if (!Number.isFinite(pid)) return null;

      return { pid, command };
    })
    .filter((p): p is { pid: number; command: string } => p !== null);
}

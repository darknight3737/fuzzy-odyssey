import { afterAll, describe, expect, it } from 'vitest';

import {
  IS_WINDOWS,
  crossExecFileSync,
  execFileAsync,
  findProcessesByName,
  getPortProcess,
  killProcess,
  spawnDetached,
} from '../process-utils';

import { createServer } from 'node:net';

const pidsToCleanup: number[] = [];

afterAll(async () => {
  for (const pid of pidsToCleanup) {
    try {
      await killProcess(pid);
    } catch {
      // already dead
    }
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function isCommandAvailable(cmd: string): Promise<boolean> {
  try {
    await execFileAsync(cmd, ['--version']);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Anything that shells out costs seconds on a cold Windows CI runner — well
// past vitest's 5s default.
const SHELL_TIMEOUT = 30_000;

// Process lookups go through PowerShell on Windows, which has been measured at
// ~28s to start on a contended runner. Budget for that plus the query.
const PROCESS_LOOKUP_TIMEOUT = 120_000;

// ---------------------------------------------------------------------------
// pnpm — the command that triggered this whole cross-platform fix.
// The MCP tools call pnpm for migrations, seeding, checks, and dev server.
// On Windows pnpm is a .cmd file that requires shell: true.
// ---------------------------------------------------------------------------

describe('pnpm commands', () => {
  it('pnpm --version (used by kit_prerequisites)', async () => {
    const result = await execFileAsync('pnpm', ['--version']);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('pnpm --version sync (used by migrations tool)', () => {
    const result = crossExecFileSync('pnpm', ['--version'], {
      encoding: 'utf8',
    });

    expect(String(result).trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('pnpm run with unknown script returns non-zero (used by run_checks)', async () => {
    // run_checks calls: pnpm run <script>
    // Verify the cross-platform wrapper surfaces the error correctly.
    await expect(
      execFileAsync('pnpm', ['run', '__nonexistent_script_xyz__']),
    ).rejects.toThrow();
  });

  it('pnpm exec passes quoted args through untouched', async () => {
    // On Windows pnpm is a `.cmd` shim, so this is the one path that goes
    // through cmd.exe — arguments must survive its double parsing intact.
    const result = await execFileAsync('pnpm', [
      'exec',
      'node',
      '-e',
      'console.log("shim (ok) & done")',
    ]);

    expect(result.stdout).toContain('shim (ok) & done');
  });

  it('pnpm ls --json (read-only, similar to deps-advisor outdated)', async () => {
    const result = await execFileAsync('pnpm', ['ls', '--json', '--depth=0']);
    // pnpm ls --json returns valid JSON
    expect(() => JSON.parse(result.stdout)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// git — used by kit_status for branch, modified files, merge checks.
// ---------------------------------------------------------------------------

describe('git commands', () => {
  it('git --version (used by kit_prerequisites)', async () => {
    const result = await execFileAsync('git', ['--version']);
    expect(result.stdout).toContain('git version');
  });

  it('git rev-parse --abbrev-ref HEAD (used by kit_status)', async () => {
    const result = await execFileAsync('git', [
      'rev-parse',
      '--abbrev-ref',
      'HEAD',
    ]);

    expect(result.stdout.trim().length).toBeGreaterThan(0);
  });

  it('git status --porcelain (used by kit_status)', async () => {
    const result = await execFileAsync('git', ['status', '--porcelain']);
    // Can be empty (clean) or have entries — just shouldn't throw
    expect(result.stderr).toBe('');
  });

  it('git log --oneline -1 (common git operation)', async () => {
    const result = await execFileAsync('git', ['log', '--oneline', '-1']);
    expect(result.stdout.trim().length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// node — used by kit_prerequisites.
// ---------------------------------------------------------------------------

describe('node commands', () => {
  it('node --version (used by kit_prerequisites)', async () => {
    const result = await execFileAsync('node', ['--version']);
    expect(result.stdout.trim()).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('node -e (used for spawning scripts)', async () => {
    const result = await execFileAsync('node', ['-e', 'console.log("hello")']);

    expect(result.stdout.trim()).toBe('hello');
  });

  it('node -e preserves shell meta characters in arguments', async () => {
    const value = 'a&b|c^d%e (f)';

    const result = await execFileAsync('node', [
      '-e',
      'console.log(process.argv[1])',
      value,
    ]);

    expect(result.stdout.trim()).toBe(value);
  });
});

// ---------------------------------------------------------------------------
// docker — used by kit_dev_start/stop for database and mailbox containers.
// Skipped if docker is not installed.
// ---------------------------------------------------------------------------

describe('docker commands', async () => {
  const hasDocker = await isCommandAvailable('docker');

  it.skipIf(!hasDocker)(
    'docker --version (used by kit_prerequisites)',
    async () => {
      const result = await execFileAsync('docker', ['--version']);
      expect(result.stdout).toContain('Docker');
    },
    SHELL_TIMEOUT,
  );

  it.skipIf(!hasDocker)(
    'docker compose version (used before compose up/stop)',
    async () => {
      const result = await execFileAsync('docker', ['compose', 'version']);
      expect(result.stdout).toContain('Docker Compose');
    },
    SHELL_TIMEOUT,
  );
});

// ---------------------------------------------------------------------------
// PowerShell — findProcessesByName runs through it on Windows.
// These two separate invocation cost from query cost, which is what pinned the
// blame when process lookups started exhausting their timeout: a contended
// runner measured 28s for the trivial command and 23s for the CIM query, so
// startup dominates and the WMI enumeration is nearly free by comparison.
// ---------------------------------------------------------------------------

describe('powershell', () => {
  it.skipIf(!IS_WINDOWS)(
    'runs a trivial command',
    async () => {
      const result = await execFileAsync('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Write-Output ok',
      ]);

      expect(result.stdout.trim()).toBe('ok');
    },
    PROCESS_LOOKUP_TIMEOUT,
  );

  it.skipIf(!IS_WINDOWS)(
    'enumerates processes via Get-CimInstance',
    async () => {
      const result = await execFileAsync('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '(Get-CimInstance Win32_Process).Count',
      ]);

      expect(Number(result.stdout.trim())).toBeGreaterThan(0);
    },
    PROCESS_LOOKUP_TIMEOUT,
  );
});

// ---------------------------------------------------------------------------
// Port operations — TCP socket check + getPortProcess.
// Used by kit_dev_status, kit_db_status, mailbox status to detect running
// services on specific ports (3000, 54333, 8025).
// ---------------------------------------------------------------------------

describe('port operations', () => {
  it('getPortProcess finds listener on a bound port', async () => {
    const server = createServer();

    const port = await new Promise<number>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        resolve(typeof addr === 'object' && addr ? addr.port : 0);
      });
    });

    try {
      const proc = await getPortProcess(port, process.cwd());

      expect(proc).not.toBeNull();
      expect(proc!.pid).toBeGreaterThan(0);
    } finally {
      server.close();
    }
  });

  it('getPortProcess returns null for port with no listener', async () => {
    // Use a high port unlikely to be in use
    const proc = await getPortProcess(59998, process.cwd());
    expect(proc).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Process lifecycle — spawnDetached + findProcessesByName + killProcess.
// The dev tools spawn pnpm and stripe as detached processes, find them by
// pattern (e.g. "stripe.*listen"), and kill them via PID/group.
// ---------------------------------------------------------------------------

describe('process lifecycle', () => {
  it(
    'spawn a long-running node process, find it, then kill it',
    async () => {
      // Spawn a detached node process (mirrors how pnpm exec next dev works)
      const marker = `__test_marker_${Date.now()}__`;

      const child = spawnDetached('node', [
        '-e',
        `process.title = "${marker}"; setTimeout(() => {}, 60000)`,
      ]);

      expect(child.pid).toBeGreaterThan(0);
      pidsToCleanup.push(child.pid!);

      await sleep(500);

      // Verify it's alive (process.kill(pid, 0) is cross-platform)
      expect(() => process.kill(child.pid!, 0)).not.toThrow();

      // findProcessesByName should find it (mirrors "stripe.*listen" pattern)
      const found = await findProcessesByName(marker, process.cwd());
      expect(found.length).toBeGreaterThan(0);

      // Kill it (mirrors kit_dev_stop stopping services)
      await killProcess(child.pid!);
      await sleep(300);

      // Verify it's dead
      expect(() => process.kill(child.pid!, 0)).toThrow();
    },
    PROCESS_LOOKUP_TIMEOUT,
  );

  it('spawn a pnpm process via spawnDetached', async () => {
    // This is exactly how kit_dev_start spawns the Next.js dev server:
    //   spawnDetached('pnpm', ['exec', 'node', '-e', '...'])
    const child = spawnDetached('pnpm', [
      'exec',
      'node',
      '-e',
      'setTimeout(() => {}, 60000)',
    ]);

    expect(child.pid).toBeGreaterThan(0);
    pidsToCleanup.push(child.pid!);

    await sleep(500);

    // Verify pnpm-spawned process is alive
    expect(() => process.kill(child.pid!, 0)).not.toThrow();

    // Clean up
    await killProcess(child.pid!);
    await sleep(300);
  });

  it(
    'findProcessesByName returns empty for nonexistent pattern',
    async () => {
      const procs = await findProcessesByName(
        'zzz_no_such_process_12345',
        process.cwd(),
      );

      expect(procs).toEqual([]);
    },
    PROCESS_LOOKUP_TIMEOUT,
  );

  it('killProcess does not throw for already-dead PID', async () => {
    const child = spawnDetached('node', ['-e', 'process.exit(0)']);

    pidsToCleanup.push(child.pid!);
    await sleep(300);

    // Process already exited — killProcess should not throw
    await expect(killProcess(child.pid!)).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Error handling — unknown commands should reject cleanly.
// ---------------------------------------------------------------------------

describe('error handling', () => {
  it('execFileAsync rejects for unknown command', async () => {
    await expect(
      execFileAsync('__nonexistent_cmd_xyz__', ['--help']),
    ).rejects.toThrow();
  });

  it('crossExecFileSync throws for unknown command', () => {
    expect(() =>
      crossExecFileSync('__nonexistent_cmd_xyz__', ['--help']),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Platform constant
// ---------------------------------------------------------------------------

describe('IS_WINDOWS', () => {
  it('matches process.platform', () => {
    expect(IS_WINDOWS).toBe(process.platform === 'win32');
  });
});

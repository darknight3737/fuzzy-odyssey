import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const isWindows = process.platform === 'win32';

function runGitCommand(...args) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 15000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    }).trim();
  } catch {
    return null;
  }
}

function log(color, message) {
  const colors = { red: 31, yellow: 33, green: 32, cyan: 36 };
  const code = colors[color] ?? 0;

  if (isWindows) {
    console.log(message);
  } else {
    console.log(`\x1b[${code}m%s\x1b[0m`, message);
  }
}

function getLocalVersion() {
  try {
    // Use git repo root to match upstream/main:package.json path
    const repoRoot = runGitCommand('rev-parse', '--show-toplevel');
    const root = repoRoot || process.cwd();
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

    return pkg.version;
  } catch {
    return null;
  }
}

function getUpstreamVersion(branch = 'main') {
  const raw = runGitCommand('show', `upstream/${branch}:package.json`);

  if (!raw) return null;

  try {
    return JSON.parse(raw).version;
  } catch {
    return null;
  }
}

function parseVersion(version) {
  if (typeof version !== 'string') return null;

  // Strip pre-release suffix (e.g. "1.3.0-canary.1" → "1.3.0")
  const clean = version.split('-')[0];
  const parts = clean.split('.').map(Number);

  if (parts.length < 3 || parts.some(Number.isNaN)) {
    return null;
  }

  return { major: parts[0], minor: parts[1], patch: parts[2] };
}

function compareTuples(a, b) {
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;

  return 0;
}

function compareVersions(local, upstream) {
  const l = parseVersion(local);
  const u = parseVersion(upstream);

  if (!l || !u) return 'success';

  const cmp = compareTuples(l, u);

  if (cmp > 0) return 'canary';
  if (cmp === 0) return 'success';

  // Upstream is ahead — determine severity
  if (l.major < u.major || l.minor < u.minor) return 'critical';
  if (u.patch - l.patch > 3) return 'critical';

  return 'warning';
}

function checkMakerkitVersion() {
  // Check if upstream remote exists before attempting fetch
  const upstreamUrl = runGitCommand('remote', 'get-url', 'upstream');

  if (!upstreamUrl) {
    log(
      'yellow',
      "⚠️ You have not setup 'upstream'. Please set up the upstream remote so you can update your Makerkit version.",
    );

    return;
  }

  const localVersion = getLocalVersion();

  if (!localVersion) {
    console.warn('Failed to read local version from package.json.');
    return;
  }

  const localParsed = parseVersion(localVersion);

  if (!localParsed) {
    console.warn('Failed to parse local version.');
    return;
  }

  // Determine which branch to compare against based on major version
  const compareBranch = localParsed.major === 2 ? 'v2' : 'main';

  // Fetch the appropriate branch from upstream (may fail with SSH auth issues)
  const fetchResult = runGitCommand(
    'fetch',
    '--quiet',
    'upstream',
    compareBranch,
  );

  if (fetchResult === null) {
    log(
      'yellow',
      `⚠️ Could not fetch from upstream. Checking cached upstream/${compareBranch} data...`,
    );

    if (isWindows && upstreamUrl.includes('git@')) {
      log(
        'yellow',
        '💡 Tip: On Windows, SSH remotes may not authenticate automatically. Consider switching to HTTPS:\n' +
          `   git remote set-url upstream ${upstreamUrl.replace(/^git@([^:]+):/, 'https://$1/').replace(/\.git$/, '')}`,
      );
    }
  }

  const upstreamVersion = getUpstreamVersion(compareBranch);

  if (!upstreamVersion) {
    console.warn('Failed to read upstream version from package.json.');
    return;
  }

  const severity = compareVersions(localVersion, upstreamVersion);

  if (severity === 'canary') {
    log(
      'cyan',
      `🚀 Running canary version (${localVersion}), ahead of stable (${upstreamVersion}).`,
    );
  } else if (severity === 'critical') {
    log(
      'red',
      `❌  Your Makerkit version (${localVersion}) is outdated. Latest is ${upstreamVersion}.`,
    );
  } else if (severity === 'warning') {
    log(
      'yellow',
      `⚠️  Your Makerkit version (${localVersion}) is behind. Latest is ${upstreamVersion}.`,
    );
  } else {
    log('green', `✅ Your Makerkit version (${localVersion}) is up to date!`);
  }

  if (severity === 'warning' || severity === 'critical') {
    log('yellow', 'Please update for bug fixes and optimizations.');
    log('cyan', `To update, run: git pull upstream ${compareBranch}`);
  }

  // Check for new major versions on main branch
  if (compareBranch !== 'main') {
    const mainVersion = getUpstreamVersion('main');

    if (mainVersion) {
      const mainParsed = parseVersion(mainVersion);

      if (mainParsed && mainParsed.major > localParsed.major) {
        log(
          'yellow',
          `📢 A new major version (${mainVersion}) is available on the main branch. Consider upgrading when ready. Please refer to the documentation for the migration guide - do not upgrade directly.`,
        );
      }
    }
  }
}

try {
  checkMakerkitVersion();
} catch {
  // Version check is informational — never block the dev server
}

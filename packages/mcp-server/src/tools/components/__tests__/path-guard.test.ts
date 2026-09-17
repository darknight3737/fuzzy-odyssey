import { describe, expect, it } from 'vitest';

import { createComponentsDeps } from '../index';

import { fileURLToPath } from 'node:url';

const WORKSPACE_ROOT = fileURLToPath(
  new URL('../../../../../../', import.meta.url),
);

describe('createComponentsDeps path containment', () => {
  const deps = createComponentsDeps(WORKSPACE_ROOT);

  it('reads a legitimate target inside packages/ui', async () => {
    await expect(deps.readUiFile('./src/shadcn/button.tsx')).resolves.toContain(
      'buttonVariants',
    );
    await expect(deps.uiFileExists('./src/shadcn/button.tsx')).resolves.toBe(
      true,
    );
  });

  it('refuses an exports target that escapes packages/ui', async () => {
    // `join()` does not clamp `..`, so without an explicit check this reads an
    // arbitrary file and streams it back to the model.
    for (const target of [
      '../../../../../../etc/passwd',
      './src/../../../etc/passwd',
      '../ui-other/secret.ts',
    ]) {
      await expect(deps.readUiFile(target)).rejects.toThrow(
        /resolves outside packages\/ui/,
      );
      await expect(deps.uiFileExists(target)).resolves.toBe(false);
    }
  });

  it('does not treat an absolute target as an escape hatch', async () => {
    // `resolve(uiRoot, '/etc/passwd')` would yield `/etc/passwd`, so the guard
    // has to reject it rather than relying on join()'s relative behaviour.
    await expect(deps.readUiFile('/etc/passwd')).rejects.toThrow(
      /resolves outside packages\/ui/,
    );
  });
});

import 'server-only';
import { createPrdDeps, createPrdService } from '@kit/mcp-server/prd-manager';
import { resolveProjectRoot } from '@kit/mcp-server/resolve-root';

interface PRDSummary {
  filename: string;
  title: string;
  lastUpdated: string;
  progress: number;
  totalStories: number;
  completedStories: number;
}

type PrdService = ReturnType<typeof createPrdService>;

// Pinned to globalThis so `next dev` HMR reuses one instance per process.
const globalStore = globalThis as typeof globalThis & {
  __devToolPrdService?: PrdService;
};

export function getPrdService(): PrdService {
  globalStore.__devToolPrdService ??= createPrdService(
    createPrdDeps(resolveProjectRoot()),
  );

  return globalStore.__devToolPrdService;
}

export async function loadPRDs(): Promise<PRDSummary[]> {
  try {
    const { prds, warnings } = await getPrdService().list();

    for (const warning of warnings) {
      console.warn('[prds]', warning);
    }

    return prds.map((prd) => ({
      filename: prd.filename,
      title: prd.title,
      lastUpdated: prd.last_updated,
      progress: prd.progress,
      totalStories: prd.total_stories,
      completedStories: prd.completed_stories,
    }));
  } catch (error) {
    console.error('Failed to load PRDs:', error);
    return [];
  }
}

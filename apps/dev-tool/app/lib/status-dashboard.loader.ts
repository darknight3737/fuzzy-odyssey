import 'server-only';
import { resolveProjectRoot } from '@kit/mcp-server/resolve-root';
import {
  createKitStatusDeps,
  createKitStatusService,
} from '@kit/mcp-server/status';

// Reuse the package's own dependency factory so the dev tool can never drift
// from the deps the MCP server itself requires (ports, filesystem, git).
export async function loadDashboardKitStatus() {
  const service = createKitStatusService(
    createKitStatusDeps(resolveProjectRoot()),
  );

  return service.getStatus({});
}

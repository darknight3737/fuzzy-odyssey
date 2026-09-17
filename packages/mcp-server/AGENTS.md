# MCP Server Instructions

This package owns Makerkit MCP tool/resource registration and adapters.

## Non-negotiables

1. Use service pattern: keep business/domain logic in `*.service.ts`, not MCP handlers.
2. `index.ts` in each tool folder is adapter only: parse input, call service, map output/errors.
3. Inject deps via `create*Deps` + `create*Service`; avoid hidden globals/singletons.
4. Keep schemas in `schema.ts`; validate all tool input with zod before service call.
5. Export public registration + service factory/types from each tool `index.ts`.
6. Add/maintain unit tests for service behavior and tool adapter behavior.
7. Register new tools/resources in `src/index.ts`.
8. Keep tool responses structured + stable; avoid breaking output shapes. Return `structuredContent` + JSON text via `buildStructuredResponse` / `buildErrorResponse` from `src/lib/tool-response.ts`; no emoji or prose-only responses.
9. Every tool declares `annotations` using a preset from `src/lib/tool-response.ts` (`READ_ONLY_TOOL`, `MUTATING_TOOL`, `IDEMPOTENT_MUTATING_TOOL`, `DESTRUCTIVE_TOOL`, `READ_ONLY_OPEN_WORLD_TOOL`) so clients can gate permissions.
10. Resolve local Supabase ports through `resolveSupabaseConfig` in `src/lib/supabase-config.ts`; never hard-code 5432x ports.
11. Validate user-supplied file names with `assertSafeFileName` from `src/lib/safe-file-name.ts` before touching the filesystem.
12. Tool adapter tests must inject fake deps (`register*Tools(server, rootPath, deps)`); never shell out to real commands from unit tests.

Service pattern is required to decouple logic from MCP server transport and keep logic testable/reusable.

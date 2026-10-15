# @kit/ui — UI Components & Styling

## Component Library

This project uses **Base UI** (not Radix UI). Key differences:

- NEVER use `asChild` prop — Base UI uses `render` prop for element composition
- ALWAYS use the `render` prop pattern when you need to render a custom element (e.g., `<Button nativeButton={false} render={<Link />} />`)

## Non-Negotiables

1. ALWAYS import as `@kit/ui/<name>` — no deep paths, no matter the folder structure
2. ALWAYS use `cn()` from `@kit/ui/utils` for class merging
3. ALWAYS use semantic Tailwind classes (`bg-background`, `text-muted-foreground`) — NEVER hardcoded colors (`bg-white`, `text-gray-500`)
4. ALWAYS add `data-test` attributes on interactive elements
5. ALWAYS add `FormMessage` to every form field for error display
6. ALWAYS consider error-handling, not just happy paths.
7. ALWAYS Ensure UI surfaces useful and human-readable errors, not internal ones.
8. NEVER add generics to `useForm` — let Zod resolver infer types
9. NEVER use `watch()` — use `useWatch` hook instead when using React Hook Form
10. NEVER use Radix UI patterns (`asChild`, `@radix-ui/*` imports) — this project uses Base UI

## Skills

- `/react-form-builder` — Full form implementation workflow with react-hook-form + Zod

## Key Components

| Component                 | Import                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Button, Card, Input, etc. | `@kit/ui/<name>`                                                                       |
| Form fields               | `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` from `@kit/ui/form` |
| Translations              | `Trans` from `@kit/ui/trans`                                                           |
| Toast                     | `toast` from `@kit/ui/sonner`                                                          |
| Conditional render        | `If` from `@kit/ui/if`                                                                 |
| Class merging             | `cn` from `@kit/ui/utils`                                                              |

## Zod

- ALWAYS import Zod as `import * as z from 'zod'`
- Place schemas in a separate file so they can be reused with server actions

/**
 * Curated one-line descriptions for `@kit/ui` subpath exports.
 *
 * Keyed by export name (the part after `@kit/ui/`) rather than by category, so
 * an export keeps its description when its file moves between `src/shadcn/`
 * and `src/makerkit/` — which is exactly how the wrap-and-re-export pattern in
 * `packages/ui/AGENTS.md` works (`./form`, `./avatar`, `./sonner`, …).
 *
 * Anything missing here still resolves: the service falls back to a generated
 * description based on the file's folder.
 */
export const COMPONENT_DESCRIPTIONS: Record<string, string> = {
  // --- shadcn primitives -----------------------------------------------
  accordion:
    'A vertically stacked set of interactive headings that each reveal a section of content',
  alert: 'Displays a callout for user attention with different severity levels',
  'alert-dialog':
    'A modal dialog that interrupts the user with important content and expects a response',
  'aspect-ratio': 'Displays content within a desired ratio',
  attachment:
    'File attachment card with media preview, title, description and actions — used in chat and upload surfaces',
  badge: 'A small status descriptor for UI elements',
  breadcrumb:
    'Displays the path to the current resource using a hierarchy of links',
  bubble:
    'Chat bubble primitives (group, bubble, content, reactions) for conversational UIs',
  button: 'Displays a button or a component that looks like a button',
  'button-group': 'Groups related buttons together with consistent spacing',
  calendar: 'A date field component that allows users to enter and edit dates',
  card: 'Displays a card with header, content, and footer',
  chart: 'A collection of chart components built on top of Recharts',
  checkbox:
    'A control that allows the user to toggle between checked and not checked',
  collapsible: 'An interactive component which can be expanded/collapsed',
  command: 'A fast, composable command menu built on cmdk',
  'context-menu':
    'A menu triggered by right-click or long-press for contextual actions',
  'data-table': 'A table component built on top of TanStack Table',
  dialog:
    'A window overlaid on either the primary window or another dialog window',
  drawer: 'A panel that slides in from the edge of the screen',
  'dropdown-menu': 'Displays a menu to the user triggered by a button',
  empty: 'An empty state placeholder component',
  field:
    'Form field wrapper primitives (label, description, error) for composing inputs',
  heading: 'Typography component for displaying headings',
  input:
    'Displays a form input field or a component that looks like an input field',
  'input-group': 'Groups an input with related addons or buttons',
  'input-otp':
    'Accessible one-time password component with copy paste functionality',
  item: 'A generic list item component with consistent styling',
  kbd: 'Keyboard shortcut indicator component',
  label: 'Renders an accessible label associated with controls',
  marker:
    'Inline marker/annotation row with icon and content, supporting separator and bordered variants',
  'menu-bar':
    'A horizontal menu bar with dropdown menus for application commands',
  message:
    'Chat message primitives (group, avatar, header, content, footer) for conversational UIs',
  'message-scroller':
    'Auto-scrolling viewport for message lists, with a jump-to-latest button',
  'native-select': 'A native HTML select element with consistent styling',
  'navigation-menu': 'A collection of links for navigating websites',
  pagination: 'Navigation component for paging through data sets',
  popover: 'Displays rich content in a portal, triggered by a button',
  progress: 'Displays an indicator showing the completion progress of a task',
  questionnaire:
    'Multi-step questionnaire flow with progress, choices, validation and navigation actions',
  'scroll-area':
    'Augments native scroll functionality for custom, cross-browser styling',
  select: 'Displays a list of options for the user to pick from',
  separator: 'Visually or semantically separates content',
  sheet:
    'Extends the Dialog component to display content that complements the main content of the screen',
  sidebar: 'A collapsible sidebar component with navigation',
  skeleton: 'Use to show a placeholder while content is loading',
  slider: 'An input where the user selects a value from within a given range',
  switch:
    'A control that allows the user to toggle between checked and not checked',
  table: 'A responsive table component',
  tabs: 'A set of layered sections of content displayed one at a time',
  textarea:
    'Displays a form textarea or a component that looks like a textarea',
  toast:
    'Base UI toast primitives with a `createToastManager()` instance — prefer `@kit/ui/sonner` for app-level toasts',
  toggle: 'A two-state button that can be either on or off',
  tooltip:
    'A popup that displays information related to an element on hover or keyboard focus',

  // --- makerkit wrappers over shadcn primitives -------------------------
  avatar:
    'Rounded-square avatar wrapper over the shadcn primitive; also exports AvatarGroup, AvatarGroupCount and AvatarBadge',
  form: 'react-hook-form bindings (FormField, FormItem, FormLabel, FormControl, FormMessage) with i18n-aware error messages',
  'radio-group':
    'A set of checkable buttons where no more than one can be checked at a time (makerkit wrapper)',
  sonner: 'App-level `toast()` API — the default way to show toasts',
  'alert-extras':
    'Companion className tokens (`alertExtras.info|success|warning`) for the shadcn Alert; apply via `cn()`',
  'badge-extras':
    'Companion className tokens (`badgeExtras.success|warning|info`) for the shadcn Badge; apply via `cn()`',
  'sidebar-extras':
    'Project-specific Sidebar class tokens (e.g. the SSR desktop guard) applied via className so the upstream sidebar stays CLI-replaceable',

  // --- makerkit components ---------------------------------------------
  'app-breadcrumbs': 'Application breadcrumb navigation component',
  'bordered-navigation-menu': 'Navigation menu component with bordered styling',
  'card-button': 'Clickable card component that acts as a button',
  'cookie-banner': 'GDPR-compliant cookie consent banner',
  'copy-to-clipboard': 'Button component for copying text to the clipboard',
  'empty-state': 'Empty state block with title, description and call to action',
  'enhanced-data-table':
    'Data table with sorting, filtering and pagination — prefer this over `@kit/ui/data-table` for app tables',
  'error-boundary': 'React error boundary component with fallback UI',
  'file-uploader':
    'File upload component with drag-and-drop and preview functionality',
  'global-loader':
    'Global loading indicator component for application-wide loading states',
  if: 'Conditional rendering component that shows children only when the condition is truthy',
  'image-uploader':
    'Component for uploading and displaying images with drag-and-drop support',
  'language-selector':
    'Component for selecting the application language/locale',
  'lazy-render':
    'Defers rendering of its children until visible in the viewport',
  'loading-overlay':
    'Overlay component that shows a loading state over content',
  marketing:
    'Marketing page building blocks (hero, feature grid, header, footer, newsletter signup, CTA)',
  'mobile-mode-toggle':
    'Mobile-optimized toggle for switching between light and dark mode',
  'mode-toggle': 'Toggle button for switching between light and dark mode',
  'navigation-schema':
    'Zod schema and types describing the app navigation configuration',
  'navigation-utils':
    'Utility functions for navigation path resolution and matching',
  'oauth-provider-logo-image': 'Displays the logo image for an OAuth provider',
  page: 'Page layout shell (Page, PageHeader, PageBody, PageNavigation, PageTitle, PageDescription) with sidebar/header style context',
  'profile-avatar':
    'User profile avatar with generated fallback from a display name',
  'sidebar-navigation':
    'Sidebar navigation rendered from a navigation config schema',
  spinner:
    "Loading spinner SVG; takes React.ComponentProps<'svg'>, so size it with a className",
  stepper: 'Step-by-step navigation component for multi-step processes',
  trans:
    'Internationalization component for translating text with interpolation support',
  'version-updater':
    'Watches for a new app version and prompts the user to reload',

  // --- base-ui ----------------------------------------------------------
  'csp-provider':
    'Supplies the CSP nonce to Base UI so its injected styles pass a strict Content Security Policy',

  // --- hooks ------------------------------------------------------------
  'hooks/use-async-dialog':
    'Hook for managing async dialog state with promise-based open/close',
  'hooks/use-mobile': 'Hook for detecting the mobile viewport breakpoint',
  'use-supabase-upload':
    'Hook for uploading files to Supabase Storage with progress tracking',

  // --- lib --------------------------------------------------------------
  utils:
    'Utility functions, including `cn()` for merging Tailwind classes (always use this for class merging)',
};

const CATEGORY_FALLBACKS: Record<string, string> = {
  shadcn: 'shadcn/Base UI primitive',
  makerkit: 'Makerkit component',
  'base-ui': 'Base UI integration module',
  hooks: 'React hook',
  utils: 'Utility module',
};

export function describeComponent(name: string, category: string) {
  return (
    COMPONENT_DESCRIPTIONS[name] ??
    `${CATEGORY_FALLBACKS[category] ?? 'Module'}: ${name}`
  );
}

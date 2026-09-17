// Project-specific Sidebar class tokens. Applied via `className` at the call
// site so that `shadcn/sidebar.tsx` stays upstream-equivalent and
// CLI-replaceable, e.g.:
//   <SidebarProvider className={sidebarExtras.ssrDesktopGuard}>

export const sidebarExtras = {
  /**
   * Hides the SSR desktop sidebar below `lg`.
   *
   * `useIsMobile` can only answer `false` on the server, so `Sidebar` always
   * renders its desktop branch into the SSR markup. Upstream gates that branch
   * at `md`, while `useIsMobile` switches at `lg` — so without this the desktop
   * sidebar paints for the whole `md`-to-`lg` band, beside whatever `lg:hidden`
   * mobile bar the layout renders, until hydration swaps it for the Sheet.
   *
   * Scoped to `[data-state]`, which only the collapsible branch sets: a
   * `collapsible="none"` sidebar has no Sheet to fall back on and must stay
   * visible.
   *
   * Apply to any ancestor of the `Sidebar` — `SidebarProvider` is the reliable
   * one, since every sidebar layout goes through it. `PageWithSidebar` applies
   * it for layouts built on `Page`; layouts that use `SidebarProvider` directly
   * (the docs layout) must apply it themselves.
   */
  ssrDesktopGuard: 'max-lg:[&_[data-slot=sidebar][data-state]]:hidden',
} as const;

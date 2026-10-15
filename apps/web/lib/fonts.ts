import { cn } from '@kit/ui/utils';

// Native fonts keep the first render independent of third-party font requests.
export function getFontsClassName(theme?: string) {
  return cn('bg-background min-h-screen antialiased', {
    dark: theme === 'dark',
    light: theme !== 'dark',
  });
}

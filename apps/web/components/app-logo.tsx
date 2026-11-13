import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@kit/ui/utils';

export function AppLogo({
  href,
  label,
  className,
  color = 'auto',
  symbolOnly = false,
}: {
  href?: string | null;
  label?: string;
  className?: string;
  color?: 'auto' | 'green' | 'white';
  symbolOnly?: boolean;
}) {
  const name = label ?? 'Selletive';
  let src = '/images/selletive-logo.svg';

  if (symbolOnly) {
    src = '/images/selletive-icon.svg';
  } else if (color === 'white') {
    src = '/images/selletive-logo-white.svg';
  }

  const logo = (
    <Image
      src={src}
      alt={href === null ? name : ''}
      width={symbolOnly ? 300 : 1000}
      height={symbolOnly ? 300 : 210}
      className={cn(
        'block h-auto w-full',
        color === 'auto' && !symbolOnly && 'dark:brightness-0 dark:invert',
      )}
      unoptimized
    />
  );
  const sizing = cn(
    'inline-block max-w-full shrink-0',
    symbolOnly ? 'w-8' : 'w-36',
    className,
  );

  return href === null ? (
    <span className={sizing}>{logo}</span>
  ) : (
    <Link
      aria-label={label ?? 'Selletive — início'}
      className={sizing}
      href={href ?? '/'}
    >
      {logo}
    </Link>
  );
}

import Link from 'next/link';

import { cn } from '@kit/ui/utils';

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  label?: string;
  className?: string;
}) {
  const mark = (
    <span
      className={cn(
        'inline-block text-2xl font-semibold lowercase tracking-tight',
        className,
      )}
    >
      selletive<span className="text-[#597665]">.</span>
    </span>
  );
  return href === null ? (
    mark
  ) : (
    <Link aria-label={label ?? 'Selletive — início'} href={href ?? '/'}>
      {mark}
    </Link>
  );
}

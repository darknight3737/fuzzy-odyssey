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
        'inline-block font-heading text-2xl font-semibold tracking-tight lowercase',
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

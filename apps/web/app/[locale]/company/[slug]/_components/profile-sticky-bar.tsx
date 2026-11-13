'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { DirectorySaveButton } from '~/components/directory-shortlist';

type Props = {
  targetId: string;
  business: { id: string; name: string; slug: string; kind: string };
  canContact: boolean;
};

export function ProfileStickyBar({ targetId, business, canContact }: Props) {
  const [state, setState] = useState({ passed: false, atEnd: false });
  // The bar mirrors the sidebar actions only after they scroll out of view and
  // hides again at the end of the profile so it never covers the footer.
  // Scroll position is browser-only state, so observers are required here.
  useEffect(() => {
    const target = document.getElementById(targetId);
    const end = document.getElementById(`${targetId}-end`);
    if (!target || !end) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === target)
          setState((current) => ({
            ...current,
            passed: !entry.isIntersecting && entry.boundingClientRect.top < 0,
          }));
        else
          setState((current) => ({
            ...current,
            atEnd: entry.isIntersecting || entry.boundingClientRect.top < 0,
          }));
      }
    });
    observer.observe(target);
    observer.observe(end);
    return () => observer.disconnect();
  }, [targetId]);
  const visible = state.passed && !state.atEnd;

  return (
    <>
      <div id={`${targetId}-end`} aria-hidden="true" className="h-px" />
      <div
        aria-hidden={!visible}
        inert={!visible}
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-[#dce5e1] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_8px_24px_rgb(1_38_32/0.10)] transition-transform duration-[180ms] ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto flex w-[min(100%-32px,1200px)] items-center justify-between gap-4 py-3">
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-[#0f161e]">
              {canContact
                ? `Fale com a equipe de ${business.name}`
                : `Salve ${business.name} na sua lista`}
            </p>
            <p className="text-sm text-[#6f7073]">
              {canContact
                ? 'Envie seu briefing e converse pela Selletive.'
                : 'Compare com outras empresas antes de decidir.'}
            </p>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <DirectorySaveButton variant="icon" business={business} />
            {canContact && (
              <Link
                href={`/projects/new?providers=${business.id}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-[#004038] px-6 text-[15px] font-semibold text-white hover:bg-[#00544c] sm:flex-none"
              >
                Solicitar proposta
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

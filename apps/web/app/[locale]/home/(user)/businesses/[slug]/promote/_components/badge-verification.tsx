'use client';

import { useState } from 'react';

import Link from 'next/link';

import { BadgeCheck, Check, Copy } from 'lucide-react';

import { buttonPrimary, buttonSecondary } from '~/components/admin-ui';

export function BadgeVerification({
  business,
  siteUrl,
  verified,
}: {
  business: { name: string; slug: string; website: string | null };
  siteUrl: string;
  verified: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const profile = `${siteUrl}/company/${business.slug}`;
  const snippet = `<a href="${profile}" title="${business.name} na Selletive"><img src="${siteUrl}/badges/selletive-verificado.svg" alt="Verificado na Selletive" width="180" height="56"></a>`;
  if (verified)
    return (
      <div className="flex items-start gap-4 rounded-xl bg-[#eaf8f1] p-6">
        <BadgeCheck aria-hidden="true" className="size-6 text-[#00665b]" />
        <div>
          <p className="font-semibold text-[#0f161e]">Perfil verificado</p>
          <p className="mt-1 text-sm text-[#3d3e45]">
            O vínculo entre o site da empresa e o perfil foi confirmado.
            Mantenha o selo publicado para conservar os benefícios do
            Verificado.
          </p>
        </div>
      </div>
    );
  return (
    <ol className="space-y-6">
      <li className="rounded-xl border border-[#dce5e1] p-6">
        <p className="text-[13px] font-medium text-[#6f7073]">Passo 1 de 3</p>
        <p className="mt-1 font-semibold text-[#0f161e]">Copie o selo</p>
        <p className="mt-1 text-sm text-[#3d3e45]">
          O selo leva visitantes do seu site até o perfil de {business.name}.
        </p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex shrink-0 items-center justify-center rounded-lg border border-[#dce5e1] bg-[#f7f9f8] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/badges/selletive-verificado.svg"
              alt="Prévia do selo Verificado na Selletive"
              width={180}
              height={56}
            />
          </div>
          <div className="min-w-0 flex-1">
            <label
              htmlFor="badge-snippet"
              className="text-sm font-medium text-[#0f161e]"
            >
              Código do selo
            </label>
            <textarea
              id="badge-snippet"
              readOnly
              rows={4}
              value={snippet}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-2 block w-full resize-none rounded-lg border border-[#7b8983] bg-white p-3 font-mono text-[13px] text-[#0f161e]"
            />
            <button
              type="button"
              className={`${buttonSecondary} mt-3`}
              onClick={() =>
                navigator.clipboard
                  .writeText(snippet)
                  .then(() => setCopied(true))
                  .catch(() => setCopied(false))
              }
            >
              {copied ? (
                <Check aria-hidden="true" className="size-4" />
              ) : (
                <Copy aria-hidden="true" className="size-4" />
              )}
              {copied ? 'Código copiado' : 'Copiar código'}
            </button>
            <p aria-live="polite" className="sr-only">
              {copied ? 'Código copiado para a área de transferência' : ''}
            </p>
          </div>
        </div>
      </li>
      <li className="rounded-xl border border-[#dce5e1] p-6">
        <p className="text-[13px] font-medium text-[#6f7073]">Passo 2 de 3</p>
        <p className="mt-1 font-semibold text-[#0f161e]">
          Cole no site da sua empresa
        </p>
        <p className="mt-1 text-sm text-[#3d3e45]">
          Publique o código em uma página pública de{' '}
          <strong>{business.website || 'seu site'}</strong>. O rodapé ou a
          página “Sobre” são os lugares mais comuns. Se o seu site usa
          WordPress, Wix ou similar, use um bloco de “HTML personalizado”.
        </p>
      </li>
      <li className="rounded-xl border border-[#dce5e1] p-6">
        <p className="text-[13px] font-medium text-[#6f7073]">Passo 3 de 3</p>
        <p className="mt-1 font-semibold text-[#0f161e]">Peça a conferência</p>
        <p className="mt-1 text-sm text-[#3d3e45]">
          Nossa equipe confere se o selo está publicado e ativa o plano
          Verificado. Você recebe a confirmação por e-mail.
        </p>
        <Link
          className={`${buttonPrimary} mt-4`}
          href={
            '/contact?subject=' +
            encodeURIComponent(
              `Conferência do selo Verificado — ${business.name} (${profile})`,
            )
          }
        >
          Já publiquei: pedir conferência
        </Link>
      </li>
    </ol>
  );
}

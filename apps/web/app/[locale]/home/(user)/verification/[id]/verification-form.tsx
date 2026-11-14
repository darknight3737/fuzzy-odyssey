'use client';

import { useState } from 'react';

import { BadgeCheck } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Textarea } from '@kit/ui/textarea';

import { verifyBusiness } from '~/lib/business-verification/actions';
import { badgeLink } from '~/lib/business-verification/schema';

export function VerificationForm({
  id,
  domain,
  token,
  canUseAccount,
  supportStatus,
  owned,
  initialCodeSent,
}: {
  id: string;
  domain: string;
  token: string;
  canUseAccount: boolean;
  supportStatus: string | null;
  owned: boolean;
  initialCodeSent: boolean;
}) {
  const action = useAction(verifyBusiness);
  const [copied, setCopied] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [supportSent, setSupportSent] = useState(supportStatus === 'pending');
  const page = useForm({
    defaultValues: { url: domain ? `https://${domain}/` : '' },
  });
  const email = useForm<{ email: string }>({ defaultValues: { email: '' } });
  const code = useForm<{ code: string }>({ defaultValues: { code: '' } });
  const support = useForm<{ message: string }>({
    defaultValues: { message: '' },
  });
  const busy = action.isPending;
  const error =
    action.result.data?.error ||
    (action.result.serverError || action.result.validationErrors
      ? 'Confira os dados informados e tente novamente.'
      : null);
  const snippet = `<a href="${badgeLink(token)}" data-selletive-badge="v1">Veja nosso perfil na Selletive</a>`;

  return (
    <div className="space-y-4">
      {domain && (
        <section className="border-primary/40 bg-primary/5 space-y-4 rounded-2xl border p-5 sm:p-7">
          <p className="text-primary flex items-center gap-2 text-sm font-semibold">
            <BadgeCheck className="size-5" aria-hidden /> Recomendado
          </p>
          <h2 className="text-xl font-semibold">
            Instale o selo e ganhe o Verificado
          </h2>
          <p>
            Seu perfil ganha o selo Verificado, mais visibilidade e acesso a
            pedidos e avaliações na Selletive.
          </p>
          <label className="block text-sm font-medium" htmlFor="badge-code">
            Copie este código e cole no rodapé ou na página Sobre do seu site.
          </label>
          <Textarea
            id="badge-code"
            readOnly
            value={snippet}
            onFocus={(event) => event.target.select()}
            rows={2}
          />
          <Button
            type="button"
            variant="outline"
            data-test="verification-copy-badge"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(snippet);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? 'Código copiado' : 'Copiar código'}
          </Button>
          <form
            className="space-y-2"
            onSubmit={page.handleSubmit(({ url }) =>
              action.execute({ id, proof: { method: 'badge', page: url } }),
            )}
          >
            <label className="block text-sm font-medium" htmlFor="badge-page">
              Página onde o selo está publicado
            </label>
            <Input
              id="badge-page"
              type="url"
              required
              data-test="verification-badge-page"
              {...page.register('url')}
            />
            <Button disabled={busy} data-test="verification-check-badge">
              Conferir selo
            </Button>
          </form>
        </section>
      )}
      <details className="rounded-xl border" open={!domain || undefined}>
        <summary className="cursor-pointer p-4 text-sm font-semibold">
          {domain
            ? 'Outras opções para confirmar vínculo'
            : 'Pedir ajuda à equipe'}
        </summary>
        <div className="divide-y px-4">
          {domain && !owned && (
            <>
              <section className="space-y-3 py-4">
                <h2 className="font-semibold">Usar e-mail corporativo</h2>
                {canUseAccount ? (
                  <Button
                    disabled={busy}
                    data-test="verification-account-email"
                    onClick={() =>
                      action.execute({ id, proof: { method: 'account_email' } })
                    }
                  >
                    Confirmar com o e-mail da conta
                  </Button>
                ) : (
                  <>
                    <form
                      className="space-y-2"
                      onSubmit={email.handleSubmit(async ({ email }) => {
                        const result = await action.executeAsync({
                          id,
                          proof: { method: 'send_email', email },
                        });
                        if (result?.data?.status === 'sent') setCodeSent(true);
                      })}
                    >
                      <label
                        className="block text-sm"
                        htmlFor="corporate-email"
                      >
                        Endereço @{domain}
                      </label>
                      <Input
                        id="corporate-email"
                        type="email"
                        required
                        maxLength={254}
                        data-test="verification-email"
                        {...email.register('email')}
                      />
                      <Button variant="outline" disabled={busy}>
                        Enviar código
                      </Button>
                    </form>
                    {(codeSent || initialCodeSent) && (
                      <form
                        className="space-y-2"
                        onSubmit={code.handleSubmit(({ code }) =>
                          action.execute({
                            id,
                            proof: { method: 'email', code },
                          }),
                        )}
                      >
                        <label className="block text-sm" htmlFor="email-code">
                          Código de 6 dígitos enviado por e-mail
                        </label>
                        <Input
                          id="email-code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          required
                          pattern="[0-9]{6}"
                          maxLength={6}
                          {...code.register('code')}
                        />
                        <Button disabled={busy}>Confirmar código</Button>
                      </form>
                    )}
                  </>
                )}
              </section>
              <details className="py-4">
                <summary className="cursor-pointer font-semibold">
                  Adicionar registro DNS TXT
                </summary>
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    Crie um registro TXT no painel que gerencia o DNS da
                    empresa.
                  </p>
                  <dl className="rounded-lg border p-3 break-all">
                    <dt className="font-medium">Nome</dt>
                    <dd>
                      <code>_selletive-verification.{domain}</code>
                    </dd>
                    <dt className="mt-2 font-medium">Valor</dt>
                    <dd>
                      <code>selletive={token}</code>
                    </dd>
                  </dl>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      action.execute({ id, proof: { method: 'dns' } })
                    }
                  >
                    Conferir registro TXT
                  </Button>
                </div>
              </details>
            </>
          )}
          <section className="space-y-2 py-4">
            <h2 className="font-semibold">Pedir análise da equipe</h2>
            {supportSent ? (
              <p role="status">
                Seu pedido está em análise. Volte a esta página para acompanhar.
              </p>
            ) : (
              <form
                className="space-y-2"
                onSubmit={support.handleSubmit(async ({ message }) => {
                  const result = await action.executeAsync({
                    id,
                    proof: { method: 'support', message },
                  });
                  if (result?.data?.status === 'support') setSupportSent(true);
                })}
              >
                {supportStatus === 'rejected' && (
                  <p>
                    O pedido anterior foi recusado. Você pode enviar mais
                    informações.
                  </p>
                )}
                <label className="block text-sm" htmlFor="verification-support">
                  Explique seu vínculo e indique como a equipe pode confirmá-lo.
                </label>
                <Textarea
                  id="verification-support"
                  minLength={20}
                  maxLength={3000}
                  required
                  {...support.register('message')}
                />
                <Button variant="outline" disabled={busy}>
                  Enviar para análise
                </Button>
              </form>
            )}
          </section>
        </div>
      </details>
      {action.isPending && <p role="status">Aguarde…</p>}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

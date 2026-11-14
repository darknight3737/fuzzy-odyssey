import { BadgeCheck } from 'lucide-react';

import { BusinessVerificationButton } from '~/components/business-verification-button';

export function BadgeVerification({
  slug,
  verified,
}: {
  slug: string;
  verified: boolean;
}) {
  if (verified)
    return (
      <section className="bg-primary/5 space-y-2 rounded-xl border p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <BadgeCheck aria-hidden /> Perfil verificado
        </h2>
        <p>Mantenha o selo publicado no site da empresa.</p>
      </section>
    );

  return (
    <section className="space-y-3 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">
        Ganhe o Verificado com o selo da Selletive
      </h2>
      <p>
        Publique o selo no site da empresa e confirme o link para ativar o
        Verificado.
      </p>
      <BusinessVerificationButton slug={slug} label="Instalar selo" />
    </section>
  );
}

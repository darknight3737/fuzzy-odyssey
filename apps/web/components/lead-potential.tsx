'use client';
import { useState } from 'react';
export function LeadPotential() {
  const [scenario, setScenario] = useState({
    visits: 1000,
    share: 10,
    conversion: 5,
  });
  const profile = Math.round((scenario.visits * scenario.share) / 100);
  const contacts = Math.round((profile * scenario.conversion) / 100);
  return (
    <section className="my-8 rounded-2xl border p-6" data-test="lead-potential">
      <p className="text-sm font-semibold">
        Simulação de potencial · cenário ilustrativo
      </p>
      <h2 className="my-3 text-2xl font-semibold">
        Veja como exposição pode virar oportunidades.
      </h2>
      <p className="mb-5 text-sm">
        A Selletive ainda não tem histórico para prever seus contatos. Ajuste as
        hipóteses abaixo: estes números não são tráfego observado, previsão nem
        garantia.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {(['visits', 'share', 'conversion'] as const).map((key) => (
          <label key={key} className="text-sm">
            {
              {
                visits: 'Visitas mensais à categoria',
                share: 'Parcela que acessa seu perfil (%)',
                conversion: 'Visitantes que entram em contato (%)',
              }[key]
            }
            <input
              className="mt-2 block w-full rounded border p-3"
              type="number"
              min={0}
              max={key === 'visits' ? 1000000 : 100}
              value={scenario[key]}
              onChange={(e) =>
                setScenario({
                  ...scenario,
                  [key]: Math.min(
                    key === 'visits' ? 1000000 : 100,
                    Math.max(0, Number(e.target.value) || 0),
                  ),
                })
              }
            />
          </label>
        ))}
      </div>
      <p className="mt-5 text-lg">
        <strong>{profile.toLocaleString('pt-BR')}</strong> visitas ao perfil →{' '}
        <strong>{contacts.toLocaleString('pt-BR')}</strong> contatos neste
        cenário
      </p>
      <p className="text-muted-foreground mt-2 text-xs">
        A parcela de visitas representa a divisão com outros fornecedores,
        posições e disponibilidade de exposição. Um contato é um pedido
        recebido, não uma venda.
      </p>
    </section>
  );
}

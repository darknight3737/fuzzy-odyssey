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
    <div data-test="lead-potential">
      <p className="mb-5 text-sm text-[#3d3e45]">
        A Selletive ainda não tem histórico para prever seus contatos. Ajuste as
        hipóteses abaixo: estes números não são tráfego observado, previsão nem
        garantia.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {(['visits', 'share', 'conversion'] as const).map((key) => (
          <label key={key} className="text-sm font-medium text-[#0f161e]">
            {
              {
                visits: 'Visitas mensais à categoria',
                share: 'Parcela que acessa seu perfil (%)',
                conversion: 'Visitantes que entram em contato (%)',
              }[key]
            }
            <input
              className="mt-2 block min-h-12 w-full rounded-lg border border-[#7b8983] bg-white px-4 text-base"
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-[#f7f9f8] p-5">
          <p className="text-sm text-[#3d3e45]">Visitas ao seu perfil</p>
          <p className="mt-1 text-[32px] leading-none font-semibold text-[#0f161e] tabular-nums">
            {profile.toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="rounded-xl bg-[#004038] p-5 text-white">
          <p className="text-sm text-[#c4ded4]">Pedidos de contato</p>
          <p className="mt-1 text-[32px] leading-none font-semibold tabular-nums">
            {contacts.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {profile} visitas ao perfil e {contacts} contatos neste cenário
      </p>
      <p className="mt-3 text-[13px] text-[#6f7073]">
        A parcela de visitas representa a divisão com outros fornecedores,
        posições e disponibilidade de exposição. Um contato é um pedido
        recebido, não uma venda.
      </p>
    </div>
  );
}

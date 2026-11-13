export type BusinessTier =
  'unclaimed' | 'claimed' | 'verified' | 'highlight' | 'spotlight';

export const TIER_LABELS: Record<BusinessTier, string> = {
  unclaimed: 'Não reivindicado',
  claimed: 'Grátis',
  verified: 'Verificado',
  highlight: 'Destaque',
  spotlight: 'Spotlight',
};

export function tierRank(tier: string) {
  return ['unclaimed', 'claimed', 'verified', 'highlight', 'spotlight'].indexOf(
    tier,
  );
}
export function canReceiveContacts(tier: string) {
  return tierRank(tier) >= 2;
}
export const canReceiveReviews = canReceiveContacts;
export function isPremium(tier: string) {
  return tier === 'highlight' || tier === 'spotlight';
}
export function getPlanLimits(tier: string) {
  return {
    cases: isPremium(tier) ? 15 : tier === 'verified' ? 3 : 1,
    images: isPremium(tier) ? 20 : 0,
    cover: isPremium(tier),
    video: isPremium(tier),
    analyticsDays: isPremium(tier) ? 365 : tier === 'verified' ? 30 : 0,
    contacts: canReceiveContacts(tier),
    reviews: canReceiveReviews(tier),
  };
}

export const MARKETPLACE_PLANS = [
  {
    id: 'claimed',
    name: 'Grátis',
    price: 0,
    description: 'Sua empresa presente no diretório B2B.',
    features: [
      'Perfil com logo e informações essenciais',
      'Categorias e especialidades relevantes',
      '1 case em texto',
      'Presença nos resultados de busca',
    ],
  },
  {
    id: 'verified',
    name: 'Verificado',
    price: 0,
    description: 'Ative contatos e avaliações com o selo no seu site.',
    features: [
      'Tudo do Grátis',
      'Link/selo conferido no site da empresa',
      'Receba contatos e avaliações de clientes',
      'Responda avaliações e publique até 3 cases',
      'Maior visibilidade por relevância',
    ],
  },
  {
    id: 'highlight',
    name: 'Destaque',
    price: 99,
    description: 'Transforme seu perfil em um canal de novas oportunidades.',
    features: [
      'Tudo do Verificado, sem exigir selo externo',
      'Capa personalizada e até 20 imagens',
      'Vídeo, demonstração e até 15 cases',
      'Calendário e botões comerciais personalizados',
      'Integração com CRM e relatórios exportáveis',
      'Vantagem de exposição em buscas compatíveis',
    ],
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    price: 299,
    description: 'Amplie sua exposição entre empresas procurando sua solução.',
    features: [
      'Tudo do Destaque',
      'Exposição patrocinada nos segmentos contratados',
      'Prioridade comercial em buscas compatíveis',
      'Relatório de exposição e contatos da campanha',
      'Disponibilidade conforme categoria e região',
    ],
  },
] as const;

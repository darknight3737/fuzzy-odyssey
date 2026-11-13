import { Suspense } from 'react';

import Link from 'next/link';
import { connection } from 'next/server';

import { CompassPageLoader } from '~/components/compass-loader';
import { DirectoryShortlist } from '~/components/directory-shortlist';
import type { DirectoryBusiness } from '~/lib/directory/marketplace';
import { pageMetadata } from '~/lib/seo';
import { getDirectoryClient } from '~/lib/supabase/directory-client';
export const metadata = pageMetadata(
  'Comparar softwares | Selletive',
  'Compare ferramentas para seu negócio.',
  '/compare',
  false,
);
type Props = { searchParams: Promise<{ ids?: string }> };
async function Content({ searchParams }: Props) {
  await connection();
  const { ids = '' } = await searchParams;
  const selected = [
    ...new Set(
      ids
        .split(',')
        .filter((id) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            id,
          ),
        ),
    ),
  ].slice(0, 3);
  const { data, error } = selected.length
    ? await getDirectoryClient()
        .from('businesses')
        .select('*')
        .in('id', selected)
    : { data: [], error: null };
  if (error) throw error;
  const items = (data as unknown as DirectoryBusiness[])
    .filter((b) => b.offering_kind === 'software')
    .sort((a, b) => selected.indexOf(a.id) - selected.indexOf(b.id));
  return (
    <main className="container mx-auto px-6 py-12">
      <h1 className="font-serif text-4xl">Comparar softwares</h1>
      <p className="text-muted-foreground mt-3">
        Compare até três ferramentas lado a lado.
      </p>
      <DirectoryShortlist />
      {items.length ? (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr>
                <th className="border-b p-4">Característica</th>
                {items.map((b) => (
                  <th className="border-b p-4" key={b.id}>
                    <Link href={`/company/${b.slug}`} className="underline">
                      {b.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [
                  'Preço inicial',
                  (b: DirectoryBusiness) =>
                    b.min_budget == null
                      ? 'Sob consulta'
                      : new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(b.min_budget),
                ],
                [
                  'Modelo de preços',
                  (b: DirectoryBusiness) => b.pricing_model || 'Não informado',
                ],
                [
                  'Implantação',
                  (b: DirectoryBusiness) =>
                    b.deployment?.join(', ') || 'Não informado',
                ],
                [
                  'Porte do comprador',
                  (b: DirectoryBusiness) =>
                    b.buyer_sizes?.join(', ') || 'Não informado',
                ],
                [
                  'Idiomas de suporte',
                  (b: DirectoryBusiness) =>
                    b.support_languages?.join(', ') || 'Não informado',
                ],
                [
                  'Recursos',
                  (b: DirectoryBusiness) =>
                    b.features?.join(', ') || 'Não informado',
                ],
                [
                  'Integrações',
                  (b: DirectoryBusiness) =>
                    b.integrations?.join(', ') || 'Não informado',
                ],
                [
                  'Teste grátis',
                  (b: DirectoryBusiness) =>
                    b.free_trial ? 'Sim' : 'Não informado',
                ],
                [
                  'Plano grátis',
                  (b: DirectoryBusiness) =>
                    b.free_plan ? 'Sim' : 'Não informado',
                ],
                [
                  'Suporte em português',
                  (b: DirectoryBusiness) =>
                    b.portuguese ? 'Sim' : 'Não informado',
                ],
              ].map(([label, get]) => (
                <tr key={label as string}>
                  <th className="border-b p-4">{label as string}</th>
                  {items.map((b) => (
                    <td className="border-b p-4" key={b.id}>
                      {(get as (b: DirectoryBusiness) => string)(b)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8">Salve softwares na busca para compará-los aqui.</p>
      )}
    </main>
  );
}
export default function Page(props: Props) {
  return (
    <Suspense fallback={<CompassPageLoader />}>
      <Content {...props} />
    </Suspense>
  );
}

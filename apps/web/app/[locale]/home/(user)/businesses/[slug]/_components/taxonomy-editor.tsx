'use client';
import { useAction } from 'next-safe-action/hooks';
import { toast } from '@kit/ui/sonner';
import { toggleTaxonomyAction } from '../_lib/taxonomy-actions';
export function TaxonomyEditor({ businessId, slug, kind, options, selected }: { businessId: string; slug: string; kind: 'category' | 'location'; options: { id: string; name: string }[]; selected: string[] }) {
  const action = useAction(toggleTaxonomyAction, { onError: () => toast.error('Não foi possível atualizar.') });
  return <details className="my-4 rounded-xl border p-5"><summary className="cursor-pointer font-semibold">{kind === 'category' ? 'Categorias' : 'Localidades'}</summary><div className="mt-4 grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">{options.map((option) => <label key={option.id} className="flex gap-2 text-sm"><input type="checkbox" checked={selected.includes(option.id)} disabled={action.isPending} onChange={(event) => action.execute({ businessId, slug, itemId: option.id, kind, selected: event.target.checked })} />{option.name}</label>)}</div></details>;
}

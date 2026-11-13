'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { toast } from '@kit/ui/sonner';

import { GallerySchema } from '~/lib/business/gallery-schema';

import {
  deleteGalleryAction,
  saveGalleryAction,
} from '../_lib/gallery-actions';
import { MediaUpload } from './media-upload';

type Item = { id: string; image_url: string; caption: string | null };
export function GalleryEditor({
  businessId,
  slug,
  items,
}: {
  businessId: string;
  slug: string;
  items: Item[];
}) {
  return (
    <section className="space-y-4">
      <p className="text-sm text-[#6f7073]">{items.length} de 20 imagens</p>
      {items.map((item) => (
        <GalleryForm
          key={item.id}
          businessId={businessId}
          slug={slug}
          item={item}
        />
      ))}
      {items.length < 20 && <GalleryForm businessId={businessId} slug={slug} />}
    </section>
  );
}
function GalleryForm({
  businessId,
  slug,
  item,
}: {
  businessId: string;
  slug: string;
  item?: Item;
}) {
  const form = useForm({
    resolver: zodResolver(GallerySchema),
    defaultValues: {
      businessId,
      slug,
      id: item?.id,
      image_url: item?.image_url ?? '',
      caption: item?.caption ?? '',
    },
  });
  const save = useAction(saveGalleryAction, {
    onSuccess: () => {
      toast.success('Imagem salva.');
      if (!item) form.reset();
    },
    onError: () => toast.error('Não foi possível salvar a imagem.'),
  });
  const remove = useAction(deleteGalleryAction, {
    onSuccess: () => toast.success('Imagem excluída.'),
    onError: () => toast.error('Não foi possível excluir.'),
  });
  return (
    <details className="rounded-xl border p-5">
      <summary className="cursor-pointer">
        {item?.caption || (item ? 'Imagem' : 'Adicionar imagem')}
      </summary>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(save.execute)}
          className="mt-4 space-y-4"
        >
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL HTTPS da imagem</FormLabel>
                <FormControl>
                  <input className="w-full rounded-lg border p-3" {...field} />
                </FormControl>
                <FormMessage />
                <MediaUpload
                  businessId={businessId}
                  kind="gallery"
                  onUploaded={(url) =>
                    form.setValue('image_url', url, { shouldValidate: true })
                  }
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="caption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legenda</FormLabel>
                <FormControl>
                  <input className="w-full rounded-lg border p-3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-4">
            <button
              disabled={save.isPending}
              className="bg-primary text-primary-foreground rounded-full px-5 py-2"
            >
              Salvar
            </button>
            {item && (
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() =>
                  remove.execute({ businessId, slug, id: item.id })
                }
                className="text-destructive underline"
              >
                Excluir
              </button>
            )}
          </div>
        </form>
      </Form>
    </details>
  );
}

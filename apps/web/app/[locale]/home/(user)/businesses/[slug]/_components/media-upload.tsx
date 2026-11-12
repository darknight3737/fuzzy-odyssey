'use client';
import { useState } from 'react';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { toast } from '@kit/ui/sonner';
export function MediaUpload({ businessId, kind, onUploaded }: { businessId: string; kind: 'logo' | 'gallery'; onUploaded: (url: string) => void }) {
  const client = useSupabase();
  const [pending, setPending] = useState(false);
  return <label className="inline-block cursor-pointer text-sm underline">{pending ? 'Enviando imagem…' : 'Enviar imagem (JPG, PNG ou WebP, até 2 MB)'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={pending} onChange={async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const extension = extensions[file.type];
    if (!extension || file.size > 2 * 1024 * 1024) { toast.error('Escolha uma imagem JPG, PNG ou WebP de até 2 MB.'); return; }
    setPending(true);
    try {
      const path = `${businessId}/${kind}/${crypto.randomUUID()}.${extension}`;
      const bucket = client.storage.from('business-media');
      const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      onUploaded(bucket.getPublicUrl(path).data.publicUrl);
      toast.success('Imagem enviada. Salve as alterações para publicá-la.');
    } catch { toast.error('Não foi possível enviar a imagem.'); } finally { setPending(false); }
  }} /></label>;
}

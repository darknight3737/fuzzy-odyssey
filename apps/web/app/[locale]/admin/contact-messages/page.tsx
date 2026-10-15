import Link from 'next/link';

import { AdminGuard } from '@kit/admin/components/admin-guard';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

async function ContactInbox() {
  const { data, error } = await getSupabaseServerClient()
    .from('contact_messages')
    .select('id,name,email,message,created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href="/admin" className="text-sm underline">
        ← Administração
      </Link>
      <h1 className="my-8 text-3xl font-semibold">Mensagens de contato</h1>
      {!data?.length && <p>Nenhuma mensagem recebida.</p>}
      <div className="space-y-5">
        {data?.map((m) => (
          <article key={m.id} className="rounded-xl border p-6">
            <h2 className="font-medium">{m.name}</h2>
            <a
              href={`mailto:${m.email}`}
              className="mt-2 block text-sm underline"
            >
              {m.email}
            </a>
            <p className="mt-4 whitespace-pre-wrap">{m.message}</p>
            <time
              className="text-muted-foreground mt-4 block text-xs"
              dateTime={m.created_at}
            >
              {new Date(m.created_at).toLocaleString('pt-BR')}
            </time>
          </article>
        ))}
      </div>
    </main>
  );
}
export default AdminGuard(ContactInbox);

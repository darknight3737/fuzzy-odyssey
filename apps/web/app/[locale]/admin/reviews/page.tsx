import Link from 'next/link';

import { AdminGuard } from '@kit/admin/components/admin-guard';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { ReviewModeration } from './_components/review-moderation';

async function ReviewsAdminPage() {
  const { data, error } = await getSupabaseServerClient()
    .from('reviews')
    .select('id,business_id,reviewer_name,rating,title,content,created_at')
    .eq('status', 'pending')
    .order('created_at')
    .limit(100);
  if (error) throw error;
  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href="/admin" className="text-sm underline">
        ← Administração
      </Link>
      <h1 className="my-8 text-3xl font-semibold">Avaliações pendentes</h1>
      {!data?.length && <p>Nenhuma avaliação aguardando moderação.</p>}
      <div className="space-y-5">
        {data?.map((r) => (
          <article key={r.id} className="rounded-xl border p-6">
            <h2 className="font-medium">
              {r.title} · {r.rating}/5
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {r.reviewer_name}
            </p>
            <p className="my-5 whitespace-pre-wrap">{r.content}</p>
            <ReviewModeration id={r.id} />
          </article>
        ))}
      </div>
    </main>
  );
}
export default AdminGuard(ReviewsAdminPage);

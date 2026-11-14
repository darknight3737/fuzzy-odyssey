import * as z from 'zod';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const root = new URL('/', request.url);
  if (!z.uuid().safeParse(token).success) return Response.redirect(root, 302);
  const { data } = await getSupabaseServerClient().rpc(
    'resolve_business_badge',
    { p_token: token },
  );
  const destination = data
    ? new URL('/company/' + encodeURIComponent(data), root)
    : root;
  return new Response(null, {
    status: 302,
    headers: { location: destination.href, 'cache-control': 'no-store' },
  });
}

import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';

import { createBusinessAnalyticsService } from '~/lib/business-analytics/service';
import { isPremium } from '~/lib/plans';
export const GET = enhanceRouteHandler(
  async ({ request, client, user }) => {
    const id = z.uuid().safeParse(request.nextUrl.searchParams.get('business'));
    if (!id.success) return new Response(null, { status: 400 });
    const { data: b, error } = await client
      .from('businesses')
      .select('id,tier')
      .eq('id', id.data)
      .eq('account_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!b || !isPremium(b.tier)) return new Response(null, { status: 403 });
    const { days } = await createBusinessAnalyticsService(client).summary(
      b.id,
      true,
    );
    const csv = [
      'Data UTC;Visualizações;Site;Telefone;E-mail',
      ...days.map(([day, c]) =>
        [day, c.view, c.website, c.phone, c.email].join(';'),
      ),
    ].join('\r\n');
    return new Response('\ufeff' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition':
          'attachment; filename="selletive-desempenho.csv"',
        'Cache-Control': 'private, no-store',
      },
    });
  },
  { auth: true },
);

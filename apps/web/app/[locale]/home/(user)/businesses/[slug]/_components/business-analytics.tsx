import type { SupabaseClient } from '@supabase/supabase-js';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

import { createBusinessAnalyticsService } from '~/lib/business-analytics/service';
import type { Database } from '~/lib/database.types';

const labels = {
  view: 'business.analyticsViews',
  website: 'business.analyticsWebsite',
  phone: 'business.analyticsPhone',
  email: 'business.analyticsEmail',
} as const;

export async function BusinessAnalytics({ client, businessId, tier }: {
  client: SupabaseClient<Database>;
  businessId: string;
  tier: string;
}) {
  if (tier !== 'highlight' && tier !== 'spotlight') {
    return <section className="my-8 rounded-xl border p-6" data-test="business-analytics-locked">
      <h2 className="text-xl font-medium"><Trans i18nKey="business.analyticsTitle" /></h2>
      <p className="text-muted-foreground mt-2 text-sm"><Trans i18nKey="business.analyticsLocked" /></p>
    </section>;
  }
  let summary;
  try {
    // Request-scoped standard client: RLS independently enforces owner, tier and MFA.
    summary = await createBusinessAnalyticsService(client).summary(businessId);
  } catch {
    return <section className="my-8 rounded-xl border p-6" role="status">
      <Trans i18nKey="business.analyticsUnavailable" />
    </section>;
  }
  return <section className="my-8 space-y-4" data-test="business-analytics">
    <div>
      <h2 className="text-xl font-medium"><Trans i18nKey="business.analyticsTitle" /></h2>
      <p className="text-muted-foreground text-sm"><Trans i18nKey="business.analyticsPeriod" /> · {summary.from} — {summary.to} (UTC)</p>
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Object.entries(labels).map(([event, label]) => <Card key={event}>
        <CardHeader className="p-4"><CardTitle className="text-sm"><Trans i18nKey={label} /></CardTitle></CardHeader>
        <CardContent className="px-4 pb-4 text-3xl" data-test={`analytics-${event}`}>
          {summary.totals[event as keyof typeof labels]}
        </CardContent>
      </Card>)}
    </div>
    <p className="text-muted-foreground text-sm"><Trans i18nKey="business.analyticsExplanation" /></p>
    {Object.values(summary.totals).every((count) => count === 0) &&
      <p className="text-sm" data-test="analytics-empty"><Trans i18nKey="business.analyticsEmpty" /></p>}
    <details>
      <summary className="cursor-pointer text-sm underline"><Trans i18nKey="business.analyticsDaily" /></summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only"><Trans i18nKey="business.analyticsDaily" /></caption>
          <thead><tr><th className="p-2"><Trans i18nKey="business.analyticsDay" /></th>
            {Object.values(labels).map((label) => <th key={label} className="p-2"><Trans i18nKey={label} /></th>)}
          </tr></thead>
          <tbody>{summary.days.map(([day, counts]) => <tr key={day} className="border-t">
            <th scope="row" className="p-2 font-normal">{day}</th>
            {Object.keys(labels).map((event) => <td key={event} className="p-2">{counts[event as keyof typeof labels]}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </details>
  </section>;
}

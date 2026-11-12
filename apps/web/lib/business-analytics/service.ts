import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '~/lib/database.types';

import type { InterestEvent } from './events';

export function createBusinessAnalyticsService(
  client: SupabaseClient<Database>,
) {
  return {
    async record(input: {
      businessId: string;
      event: InterestEvent;
      visitorHash: string;
      actorId: string | null;
      day: string;
    }) {
      const { error } = await client.rpc('record_business_interest', {
        p_business_id: input.businessId,
        p_event: input.event,
        p_visitor_hash: input.visitorHash,
        p_actor_id: input.actorId ?? undefined,
        p_day: input.day,
      });
      if (error) throw error;
    },
    async summary(businessId: string, fullHistory = false) {
      const now = new Date();
      const to = now.toISOString().slice(0, 10);
      const start = new Date(now);
      start.setUTCDate(start.getUTCDate() - (fullHistory ? 364 : 29));
      const from = start.toISOString().slice(0, 10);
      let query = client
        .from('business_analytics_daily')
        .select('day,event,count')
        .eq('business_id', businessId)
        .lte('day', to);
      query = query.gte('day', from);
      const first = await query
        .order('day', { ascending: false })
        .order('event')
        .range(0, 999);
      if (first.error) throw first.error;
      const data = first.data;
      if (data.length === 1000) {
        const rest = await query.range(1000, 1499);
        if (rest.error) throw rest.error;
        data.push(...rest.data);
      }
      const totals = { view: 0, website: 0, phone: 0, email: 0 };
      const daily = new Map<string, typeof totals>();
      for (let i = 29; i >= 0 && !fullHistory; i--) {
        const date = new Date(`${to}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() - i);
        daily.set(date.toISOString().slice(0, 10), { ...totals });
      }
      for (const row of data) {
        if (!(row.event in totals)) continue;
        const event = row.event as InterestEvent;
        totals[event] += row.count;
        if (!daily.has(row.day))
          daily.set(row.day, { view: 0, website: 0, phone: 0, email: 0 });
        const day = daily.get(row.day);
        if (day) day[event] += row.count;
      }
      return {
        totals,
        days: [...daily].sort(([a], [b]) => b.localeCompare(a)),
        from: fullHistory && data.length ? data[data.length - 1]!.day : from,
        to,
      };
    },
  };
}

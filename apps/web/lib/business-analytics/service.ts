import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '~/lib/database.types';

import type { InterestEvent } from './events';

export function createBusinessAnalyticsService(client: SupabaseClient<Database>) {
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
    async summary(businessId: string) {
      const now = new Date();
      const to = now.toISOString().slice(0, 10);
      const start = new Date(now);
      start.setUTCDate(start.getUTCDate() - 29);
      const from = start.toISOString().slice(0, 10);
      const { data, error } = await client
        .from('business_analytics_daily')
        .select('day,event,count')
        .eq('business_id', businessId)
        .gte('day', from)
        .lte('day', to)
        .order('day', { ascending: false });
      if (error) throw error;
      const totals = { view: 0, website: 0, phone: 0, email: 0 };
      const daily = new Map<string, typeof totals>();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(`${to}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() - i);
        daily.set(date.toISOString().slice(0, 10), { ...totals });
      }
      for (const row of data) {
        if (!(row.event in totals)) continue;
        const event = row.event as InterestEvent;
        totals[event] += row.count;
        const day = daily.get(row.day);
        if (day) day[event] += row.count;
      }
      return { totals, days: [...daily].reverse(), from, to };
    },
  };
}

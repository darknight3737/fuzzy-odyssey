import * as z from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import appConfig from '~/config/app.config';
import { interestEvents } from '~/lib/business-analytics/events';
import { createBusinessAnalyticsService } from '~/lib/business-analytics/service';

import { createHmac } from 'node:crypto';

const EventSchema = z
  .object({ businessId: z.uuid(), event: z.enum(interestEvents) })
  .strict();
const ignoredAgent =
  /bot|crawler|spider|headless|preview|lighthouse|facebookexternalhit|slurp/i;
const empty = () =>
  new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

export const POST = enhanceRouteHandler(
  async ({ request, client }) => {
    // No third-party submissions, cookies or redirects. Origin is checked against
    // configured deployment, never against a caller-controlled Host header.
    const headers = request.headers;
    if (
      headers.get('origin') !== new URL(appConfig.url).origin ||
      headers.get('sec-fetch-site') !== 'same-origin'
    ) {
      return new Response(null, { status: 403 });
    }
    if (
      headers.get('dnt') === '1' ||
      headers.get('sec-gpc') === '1' ||
      ignoredAgent.test(headers.get('user-agent') ?? '')
    )
      return empty();
    if (headers.get('content-type')?.split(';')[0] !== 'application/json') {
      return new Response(null, { status: 415 });
    }
    // Bound actual streamed bytes, not merely the optional Content-Length header.
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400 });
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 512) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      chunks.push(value);
    }
    let payload: unknown;
    try {
      payload = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
    } catch {
      return new Response(null, { status: 400 });
    }
    const parsed = EventSchema.safeParse(payload);
    if (!parsed.success) return new Response(null, { status: 400 });
    // Cloudflare overwrites this header at the trusted edge. No forwarded-IP
    // fallback: missing edge identity must never collapse all visitors together.
    const ip = headers.get('cf-connecting-ip');
    const secret =
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!ip || !secret) return empty();
    const day = new Date().toISOString().slice(0, 10);
    const visitorHash = createHmac('sha256', secret)
      .update(`business-interest:${day}:${ip}`)
      .digest('hex');
    try {
      const {
        data: { user },
        error,
      } = await client.auth.getUser();
      // An invalid/stale session is not silently counted as an unrelated visitor.
      if (error && error.name !== 'AuthSessionMissingError') return empty();
      // Privileged writer is deliberately limited to a service-only RPC. No
      // submitted ownership, timestamps, counts or hashes are accepted.
      await createBusinessAnalyticsService(
        getSupabaseServerAdminClient(),
      ).record({
        ...parsed.data,
        visitorHash,
        day,
        actorId: user?.id ?? null,
      });
    } catch {
      console.error('business_interest_record_failed');
      return new Response(null, {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    return empty();
  },
  { auth: false },
);

import * as z from 'zod';

import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { OfferingWebsiteSchema } from '~/lib/offerings/schema';

const MetadataSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    title: z.string().nullish(),
    description: z.string().nullish(),
  }),
});

export async function GET(request: Request) {
  const client = getSupabaseServerClient();
  const { data: user } = await requireUser(client);

  if (!user || user.is_anonymous) return Response.json(null, { status: 401 });

  const website = OfferingWebsiteSchema.safeParse(
    new URL(request.url).searchParams.get('website'),
  );

  if (!website.success) return Response.json(null, { status: 400 });

  const { origin, hostname, pathname } = new URL(website.data);
  if (
    !/\.[a-z][a-z0-9-]+$/i.test(hostname) ||
    /\.(?:localhost|local|internal|test|invalid|example|onion)$/i.test(
      hostname,
    ) ||
    hostname === 'home.arpa' ||
    hostname.endsWith('.home.arpa')
  ) {
    return Response.json(null, { status: 400 });
  }

  // The application only connects to the metadata provider. Pass the public
  // page URL without query parameters or fragments.
  const apiKey = process.env.MICROLINK_API_KEY;
  const endpoint = new URL(
    apiKey ? 'https://pro.microlink.io/' : 'https://api.microlink.io/',
  );
  endpoint.search = new URLSearchParams({
    url: origin + pathname,
    'meta.title': 'true',
    'meta.description': 'true',
    filter: 'title,description',
  }).toString();

  try {
    const response = await fetch(endpoint, {
      redirect: 'error',
      headers: apiKey ? { 'x-api-key': apiKey } : undefined,
      next: { revalidate: 3600 },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(5000)]),
    });
    if (!response.ok) return Response.json(null, { status: 502 });

    const metadata = MetadataSchema.safeParse(await response.json());
    if (!metadata.success) return Response.json(null, { status: 502 });

    const { title, description } = metadata.data.data;
    return Response.json({
      name: title?.trim().slice(0, 160) ?? '',
      description: description?.trim().slice(0, 10000) ?? '',
    });
  } catch {
    return Response.json(null, { status: 502 });
  }
}

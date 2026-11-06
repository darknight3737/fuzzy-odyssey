import { enhanceRouteHandler } from '@kit/next/routes';

import appConfig from '~/config/app.config';
import { createSocialImage } from '~/lib/social-image-response';
import { socialImageUrl } from '~/lib/social-images';
import { getDirectoryClient } from '~/lib/supabase/directory-client';

export const GET = enhanceRouteHandler(
  async ({ request, params }) => {
    const kind = params.kind ?? '';
    const slug = params.slug ?? '';
    if (
      (kind !== 'site' && kind !== 'company' && kind !== 'category') ||
      !/^[\p{L}\p{N}_-]{1,200}$/u.test(slug)
    ) {
      return new Response('Not found', { status: 404 });
    }

    let title = appConfig.title;
    let description = appConfig.description;
    let version = '1';
    let label = 'Empresas e serviços B2B';

    if (kind === 'site') {
      if (slug !== 'default') return new Response('Not found', { status: 404 });
    } else {
      const client = getDirectoryClient();
      const query =
        kind === 'company'
          ? client
              .from('businesses')
              .select('name,description,updated_at')
              .eq('slug', slug)
          : client
              .from('categories')
              .select('name,description,updated_at')
              .eq('slug', slug)
              .eq('is_active', true);
      const { data, error } = await query.maybeSingle();
      if (error) return new Response('Unavailable', { status: 503 });
      if (!data) return new Response('Not found', { status: 404 });
      title = data.name;
      description = data.description || `Conheça ${data.name} na Selletive.`;
      version = data.updated_at ?? '1';
      label = kind === 'company' ? 'Perfil da empresa' : 'Compare empresas';
    }

    // Only catalog content is rendered. Normalize query parameters to one cache key.
    const canonical = socialImageUrl(kind, slug, version);
    if (new URL(request.url).search !== new URL(canonical).search) {
      return Response.redirect(canonical, 307);
    }
    return createSocialImage({ title, description, label });
  },
  { auth: false },
);

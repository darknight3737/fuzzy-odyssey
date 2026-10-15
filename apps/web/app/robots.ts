import type { MetadataRoute } from 'next';

import appConfig from '~/config/app.config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/home', '/admin', '/auth', '/api/'],
    },
    sitemap: `${appConfig.url}/sitemap.xml`,
  };
}

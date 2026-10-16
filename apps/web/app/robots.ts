import type { MetadataRoute } from 'next';

import appConfig from '~/config/app.config';

export default function robots(): MetadataRoute.Robots {
  if (process.env.SELLETIVE_DEPLOYMENT_STAGE === 'preview') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/home', '/admin', '/auth', '/api/'],
    },
    sitemap: `${appConfig.url}/sitemap.xml`,
  };
}

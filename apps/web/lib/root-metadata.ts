import { Metadata } from 'next';

import appConfig from '~/config/app.config';
import { socialImageMetadata, socialImageUrl } from '~/lib/social-images';

/**
 * @name generateRootMetadata
 * @description Generates the root metadata for the application
 */
export const generateRootMetadata = (): Metadata => {
  return {
    title: appConfig.title,
    description: appConfig.description,
    metadataBase: new URL(appConfig.url),
    applicationName: appConfig.name,
    openGraph: {
      url: appConfig.url,
      siteName: appConfig.name,
      title: appConfig.title,
      description: appConfig.description,
      images: [
        socialImageMetadata(socialImageUrl('site', 'default'), appConfig.title),
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: appConfig.title,
      description: appConfig.description,
      images: [socialImageUrl('site', 'default')],
    },
    icons: {
      icon: {
        url: '/images/favicon/selletive-symbol.svg',
        type: 'image/svg+xml',
      },
      apple: '/images/favicon/selletive-apple-touch-icon.png',
    },
  };
};

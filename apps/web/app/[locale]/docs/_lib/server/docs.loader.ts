import { cacheLife } from 'next/cache';

import { createCmsClient } from '@kit/cms';
import { getLogger } from '@kit/shared/logger';

/**
 * @name getDocs
 * @description Load the documentation pages.
 * @param language
 */
export async function getDocs(language: string | undefined) {
  'use cache';
  cacheLife('hours');

  const cms = await createCmsClient();
  const logger = await getLogger();

  try {
    const data = await cms.getContentItems({
      collection: 'documentation',
      language,
      limit: Infinity,
      content: false,
    });

    return data.items;
  } catch (error) {
    logger.error({ error }, 'Failed to load documentation pages');

    return [];
  }
}

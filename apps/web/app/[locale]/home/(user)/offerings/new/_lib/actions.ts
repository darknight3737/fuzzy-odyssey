'use server';
import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { authActionClient } from '@kit/next/safe-action';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { taxonomyKind } from '~/lib/directory/taxonomy';
import { OfferingSchema } from '~/lib/offerings/schema';

import { randomUUID } from 'node:crypto';
export const createOfferingAction = authActionClient
  .inputSchema(OfferingSchema)
  .action(async ({ parsedInput }) => {
    const slugBase = parsedInput.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120);
    const slug = `${slugBase || 'solucao'}-${randomUUID().slice(0, 8)}`;
    const client = getSupabaseServerClient();
    const { data: categories, error: categoryError } = await client
      .from('categories')
      .select('slug')
      .eq('is_active', true)
      .in('id', parsedInput.category_ids);
    if (categoryError) return { issue: 'unknown' } as const;
    if (
      categories.length !== new Set(parsedInput.category_ids).size ||
      categories.some(
        ({ slug }) => taxonomyKind(slug) !== parsedInput.offering_kind,
      )
    ) {
      return { issue: 'invalid' } as const;
    }

    const { error } = await client.rpc('create_marketplace_offering', {
      p_payload: {
        ...parsedInput,
        slug,
        vendor_business_id:
          parsedInput.offering_kind === 'software'
            ? parsedInput.vendor_business_id
            : '',
      },
    });
    if (error) {
      if (error.code === 'SL001') return { issue: 'domain' } as const;
      if (error.code === 'SL002') return { issue: 'duplicate' } as const;
      if (
        error.code === 'P0001' &&
        [
          'Invalid profile details',
          'Valid HTTPS website required',
          'Vendor must belong to your account',
          'Invalid categories',
        ].includes(error.message)
      ) {
        return { issue: 'invalid' } as const;
      }
      const logger = await getLogger();
      logger.error(
        { code: error.code },
        'Failed to publish marketplace offering',
      );
      return { issue: 'unknown' } as const;
    }
    updateTag('directory');
    revalidatePath('/[locale]/home/(user)/businesses/[slug]', 'page');
    redirect('/home/businesses/' + slug + '?onboarding=published');
  });

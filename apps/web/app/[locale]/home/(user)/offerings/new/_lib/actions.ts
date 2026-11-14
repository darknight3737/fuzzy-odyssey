'use server';
import { redirect } from 'next/navigation';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { verificationDomain } from '~/lib/business-verification/schema';
import { taxonomyKind } from '~/lib/directory/taxonomy';
import { OfferingSchema } from '~/lib/offerings/schema';

import { randomUUID } from 'node:crypto';
export const createOfferingAction = authActionClient
  .inputSchema(OfferingSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
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

    const domain = verificationDomain(parsedInput.website);
    if (!domain || user.is_anonymous) return { issue: 'invalid' } as const;

    const { data: request, error } = await getSupabaseServerAdminClient()
      .from('business_verification_requests')
      .insert({
        account_id: user.id,
        domain,
        draft: {
          ...parsedInput,
          slug,
          vendor_business_id:
            parsedInput.offering_kind === 'software'
              ? parsedInput.vendor_business_id
              : '',
        },
      })
      .select('id')
      .single();
    if (error) return { issue: 'unknown' } as const;
    redirect('/home/verification/' + request.id);
  });

'use server';
import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { taxonomyKind } from '~/lib/directory/taxonomy';
import { OfferingSchema } from '~/lib/offerings/schema';

import { randomUUID } from 'node:crypto';
export const createOfferingAction = authActionClient
  .inputSchema(OfferingSchema)
  .action(async ({ parsedInput }) => {
    const slug =
      parsedInput.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 120) +
      '-' +
      randomUUID().slice(0, 8);
    const client = getSupabaseServerClient();
    const { data: categories, error: categoryError } = await client
      .from('categories')
      .select('slug')
      .eq('is_active', true)
      .in('id', parsedInput.category_ids);
    if (
      categoryError ||
      categories.length !== new Set(parsedInput.category_ids).size ||
      categories.some(
        ({ slug }) => taxonomyKind(slug) !== parsedInput.offering_kind,
      )
    ) {
      throw new Error('Escolha categorias do mesmo tipo da oferta.');
    }

    const { error } = await client.rpc('create_marketplace_offering', {
      p_payload: { ...parsedInput, slug },
    });
    if (error)
      throw new Error(
        'Não foi possível cadastrar. Confira sua conta, categorias e o fornecedor vinculado.',
      );
    updateTag('directory');
    redirect('/home/businesses/' + slug);
  });

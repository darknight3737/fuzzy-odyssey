'use server';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { ContactEmailSchema } from '../contact-email.schema';

export const sendContactEmail = enhanceAction(
  async (data) => {
    const { error } = await getSupabaseServerClient()
      .from('contact_messages')
      .insert({
        name: data.name,
        email: data.email,
        message: data.message,
      });
    if (error)
      throw new Error('Não foi possível enviar sua mensagem. Tente novamente.');
    return {};
  },
  { schema: ContactEmailSchema, auth: false },
);

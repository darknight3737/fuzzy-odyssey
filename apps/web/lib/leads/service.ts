import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { z } from 'zod';
import type { Database } from '~/lib/database.types';
import type { LeadSchema } from './schema';
export function createLeadService(client: SupabaseClient<Database>) {
 return {
  async create(input: z.infer<typeof LeadSchema>) {
   const {data,error}=await client.rpc('create_lead_brief',{p_payload:input});
   if(error) throw new Error('Não foi possível enviar. Confira os destinatários e tente novamente.');
   return data;
  },
  async close(id:string) {const {error}=await client.rpc('close_lead_brief',{p_brief_id:id});if(error) throw error;},
 };
}

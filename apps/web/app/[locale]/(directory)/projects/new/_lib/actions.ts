'use server';
import { redirect } from 'next/navigation';
import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { LeadSchema } from '~/lib/leads/schema';
import { createLeadService } from '~/lib/leads/service';
export const submitLeadAction=authActionClient.inputSchema(LeadSchema).action(async({parsedInput})=>{
 await createLeadService(getSupabaseServerClient()).create(parsedInput);
 redirect('/home/leads?sent=1');
});

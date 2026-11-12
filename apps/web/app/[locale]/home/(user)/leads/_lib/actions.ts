'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {authActionClient} from '@kit/next/safe-action';
import {getSupabaseServerClient} from '@kit/supabase/server-client';
import {LeadMessageSchema} from '~/lib/leads/schema';
import {createLeadService} from '~/lib/leads/service';
export const sendLeadMessageAction=authActionClient.inputSchema(LeadMessageSchema).action(async({parsedInput,ctx})=>{
 const client=getSupabaseServerClient();
 const {error}=await client.from('lead_messages').insert({brief_id:parsedInput.briefId,business_id:parsedInput.businessId,content:parsedInput.content,sender_id:ctx.user.id});
 if(error)throw new Error('Não foi possível enviar a mensagem. Confira se o pedido ainda está aberto.');
 revalidatePath('/home/leads/'+parsedInput.briefId);
 return {success:true};
});
export const closeLeadAction=authActionClient.inputSchema(z.object({id:z.uuid()})).action(async({parsedInput})=>{await createLeadService(getSupabaseServerClient()).close(parsedInput.id);revalidatePath('/home/leads');revalidatePath('/home/leads/'+parsedInput.id);return {success:true};});
export const updateLeadStatusAction=authActionClient.inputSchema(z.object({briefId:z.uuid(),businessId:z.uuid(),status:z.enum(['new','contacted','declined'])})).action(async({parsedInput})=>{const {error}=await getSupabaseServerClient().from('lead_recipients').update({status:parsedInput.status}).eq('brief_id',parsedInput.briefId).eq('business_id',parsedInput.businessId);if(error)throw error;revalidatePath('/home/leads/'+parsedInput.briefId);return {success:true};});

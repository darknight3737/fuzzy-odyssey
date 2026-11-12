'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {authActionClient} from '@kit/next/safe-action';
import {getSupabaseServerClient} from '@kit/supabase/server-client';
import {LeadMessageSchema} from '~/lib/leads/schema';
import {isPremium} from '~/lib/plans';
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

const hubspot = 'https://api.hubapi.com/crm/v3/objects/contacts';
export const configureCrmAction=authActionClient.inputSchema(z.object({businessId:z.uuid(),token:z.string().trim().min(20).max(512)})).action(async({parsedInput,ctx})=>{
 const client=getSupabaseServerClient();
 const {data:owner}=await client.from('businesses').select('tier').eq('id',parsedInput.businessId).eq('account_id',ctx.user.id).maybeSingle();
 if(!owner||!isPremium(owner.tier))throw new Error('Disponível em Destaque e Spotlight.');
 const {error}=await client.from('business_integrations').upsert({business_id:parsedInput.businessId,webhook_url:hubspot,secret:parsedInput.token,enabled:true},{onConflict:'business_id'});
 if(error)throw new Error('Não foi possível salvar a conexão.');
 return {success:true};
});
export const sendToCrmAction=authActionClient.inputSchema(z.object({briefId:z.uuid(),businessId:z.uuid()})).action(async({parsedInput,ctx})=>{
 const client=getSupabaseServerClient();
 const {data:owner}=await client.from('businesses').select('tier').eq('id',parsedInput.businessId).eq('account_id',ctx.user.id).maybeSingle();
 if(!owner||!isPremium(owner.tier))throw new Error('Disponível em Destaque e Spotlight.');
 const [{data:integration},{data:recipient}]=await Promise.all([
  client.from('business_integrations').select('secret,enabled,webhook_url').eq('business_id',parsedInput.businessId).maybeSingle(),
  client.from('lead_recipients').select('lead_briefs(buyer_email,buyer_name,company_name)').eq('brief_id',parsedInput.briefId).eq('business_id',parsedInput.businessId).maybeSingle(),
 ]);
 if(!integration?.enabled||integration.webhook_url!==hubspot||!integration.secret||!recipient?.lead_briefs)throw new Error('Configure a conexão antes de enviar.');
 const lead=recipient.lead_briefs;
 const response=await fetch(hubspot,{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+integration.secret,'Content-Type':'application/json'},body:JSON.stringify({properties:{email:lead.buyer_email,firstname:lead.buyer_name,company:lead.company_name??''}}),signal:AbortSignal.timeout(8000)});
 if(!response.ok&&response.status!==409)throw new Error('O HubSpot não aceitou o contato. Confira a chave e as permissões.');
 return {success:true,existing:response.status===409};
});

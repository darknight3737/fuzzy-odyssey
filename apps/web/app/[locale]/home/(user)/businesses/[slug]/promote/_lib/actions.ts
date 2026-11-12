'use server';
import {randomUUID} from 'node:crypto';
import {revalidatePath,updateTag} from 'next/cache';
import {z} from 'zod';
import {authActionClient} from '@kit/next/safe-action';
import {getSupabaseServerClient} from '@kit/supabase/server-client';
import {getSupabaseServerAdminClient} from '@kit/supabase/server-admin-client';
import appConfig from '~/config/app.config';
import {checkBadgeLink} from '~/lib/verification/link-checker';
const schema=z.object({businessId:z.uuid(),page:z.string().max(2000).optional()});
export const verifyBadgeAction=authActionClient.inputSchema(schema).action(async({parsedInput,ctx})=>{
 const client=getSupabaseServerClient();const {data:b,error}=await client.from('businesses').select('id,slug,website,account_id').eq('id',parsedInput.businessId).eq('account_id',ctx.user.id).single();if(error||!b?.website)throw new Error('Confira o site cadastrado e sua permissão no perfil.');
 const admin=getSupabaseServerAdminClient();const {data:existing,error:readError}=await admin.from('verification_badges').select('id,badge_code,last_checked').eq('business_id',b.id).limit(1).maybeSingle();if(readError)throw readError;
 let badge=existing;
 if(!badge){const {data,error:insertError}=await admin.from('verification_badges').insert({business_id:b.id,badge_code:randomUUID()}).select('id,badge_code,last_checked').single();if(insertError)throw insertError;badge=data;}
 if(!parsedInput.page)return {code:badge.badge_code,verified:false};
 if(badge.last_checked&&Date.now()-Date.parse(badge.last_checked)<60000)throw new Error('Aguarde um minuto entre conferências.');
 const {error:stampError}=await admin.from('verification_badges').update({last_checked:new Date().toISOString()}).eq('id',badge.id);if(stampError)throw stampError;
 const verified=await checkBadgeLink(b.website,parsedInput.page,new URL('/company/'+b.slug,appConfig.url).href,badge.badge_code);
 const {error:attestError}=await admin.rpc('attest_business_badge',{p_badge_id:badge.id,p_verified:verified,p_expected_website:b.website});if(attestError)throw attestError;
 updateTag('directory');revalidatePath('/company/'+b.slug);revalidatePath('/home/businesses/'+b.slug+'/promote');
 return {code:badge.badge_code,verified};
});

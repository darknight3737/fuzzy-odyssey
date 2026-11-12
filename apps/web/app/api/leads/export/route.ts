import {enhanceRouteHandler} from '@kit/next/routes';
import {isPremium} from '~/lib/plans';
export const GET=enhanceRouteHandler(async({client,user})=>{
 const {data:owned,error:ownedError}=await client.from('businesses').select('id,tier').eq('account_id',user.id);if(ownedError)throw ownedError;
 const ids=owned?.filter(b=>isPremium(b.tier)).map(b=>b.id)??[];if(!ids.length)return new Response('Disponível no Destaque e Spotlight.',{status:403});
 const {data,error}=await client.from('lead_recipients').select('business_id,status,lead_briefs(title,buyer_name,buyer_email,buyer_phone,company_name,budget,timeline,created_at)').in('business_id',ids).limit(5000);if(error)throw error;
 const cell=(value:unknown)=>{const s=String(value??'');return '"'+(/^[=+@\-\t\r]/.test(s)?"'":'')+s.replaceAll('"','""')+'"';};
 const rows=[['Empresa ID','Status','Pedido','Nome','Email','Telefone','Empresa compradora','Orçamento','Prazo','Data'],...(data??[]).map(r=>[r.business_id,r.status,r.lead_briefs?.title,r.lead_briefs?.buyer_name,r.lead_briefs?.buyer_email,r.lead_briefs?.buyer_phone,r.lead_briefs?.company_name,r.lead_briefs?.budget,r.lead_briefs?.timeline,r.lead_briefs?.created_at])];
 return new Response('\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="selletive-contatos.csv"','Cache-Control':'private, no-store'}});
},{auth:true});

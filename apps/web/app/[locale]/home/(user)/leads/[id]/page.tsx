import {Suspense} from 'react';
import Link from 'next/link';
import {connection} from 'next/server';
import {notFound,redirect} from 'next/navigation';
import {getSupabaseServerClient} from '@kit/supabase/server-client';
import {MessageForm,CloseLead,LeadStatus} from '../_components/message-form';
export const metadata={title:'Conversa do pedido | Selletive',robots:{index:false,follow:false}};
async function Conversation({params}:{params:Promise<{id:string}>}){await connection();const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();const client=getSupabaseServerClient();const {data:{user}}=await client.auth.getUser();if(!user)redirect('/auth/sign-in');
 const {data:brief,error}=await client.from('lead_briefs').select('*').eq('id',id).maybeSingle();if(error)throw error;if(!brief)notFound();
 const [{data:recipients,error:recipientError},{data:messages,error:messageError}]=await Promise.all([client.from('lead_recipients').select('business_id,status,businesses(name,slug,account_id)').eq('brief_id',id),client.from('lead_messages').select('id,business_id,sender_id,content,created_at').eq('brief_id',id).order('created_at').limit(200)]);if(recipientError||messageError)throw recipientError??messageError;
 const buyer=brief.buyer_user_id===user.id;
 return <><Link className="underline" href="/home/leads">← Todos os pedidos</Link><h1 className="my-5 text-3xl font-semibold">{brief.title}</h1><p className="whitespace-pre-wrap">{brief.description}</p><dl className="my-6 grid gap-2 text-sm"><div>Solicitante: {brief.buyer_name} · {brief.company_name}</div><div>Contato: {brief.buyer_email} {brief.buyer_phone}</div><div>Orçamento: {brief.budget===null?'A combinar':Number(brief.budget).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div><div>Prazo: {brief.timeline||'A combinar'} · {brief.status==='open'?'Aberto':'Encerrado'}</div></dl>{buyer&&brief.status==='open'&&<CloseLead id={id}/>}
 {!recipients?.length&&<p className="my-6 rounded-xl border p-6">Pedido registrado. Ainda não há fornecedores disponíveis para esta combinação. Você pode explorar o diretório e iniciar outro pedido com empresas disponíveis.</p>}
 {recipients?.map(r=><section key={r.business_id} className="my-6 rounded-2xl border p-6"><h2 className="text-xl font-semibold">{r.businesses?.name??'Fornecedor'}</h2>{!buyer&&<LeadStatus briefId={id} businessId={r.business_id} status={r.status}/>}
 <div className="my-4 space-y-3">{messages?.filter(m=>m.business_id===r.business_id).map(m=><article key={m.id} className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">{m.sender_id===user.id?'Você':m.sender_id===brief.buyer_user_id?'Solicitante':'Fornecedor'} · {new Date(m.created_at).toLocaleString('pt-BR')}</p><p className="mt-2 whitespace-pre-wrap">{m.content}</p></article>)}</div>{brief.status==='open'?<MessageForm briefId={id} businessId={r.business_id}/>:<p>Este pedido foi encerrado.</p>}</section>)}</>;
}
export default function Page(props:{params:Promise<{id:string}>}){return <main className="mx-auto w-full max-w-4xl p-6"><Suspense fallback={<p>Carregando conversa…</p>}><Conversation {...props}/></Suspense></main>;}

import {Suspense} from 'react';
import Link from 'next/link';
import {connection} from 'next/server';
import {redirect} from 'next/navigation';
import {getSupabaseServerClient} from '@kit/supabase/server-client';
export const metadata={title:'Pedidos e oportunidades | Selletive',robots:{index:false,follow:false}};
async function Inbox(){await connection();const client=getSupabaseServerClient();const {data:{user}}=await client.auth.getUser();if(!user)redirect('/auth/sign-in');
 const {data:briefs,error}=await client.from('lead_briefs').select('id,title,description,buyer_user_id,offering_kind,status,created_at').order('created_at',{ascending:false}).limit(100);if(error)throw error;
 return <><div className="my-6 flex flex-wrap gap-4"><Link href="/projects/new" className="rounded-full border px-5 py-3">Novo pedido</Link><Link href="/api/leads/export" className="rounded-full border px-5 py-3">Exportar meus contatos CSV</Link></div>{!briefs?.length?<p className="rounded-xl border p-8">Seus pedidos e as oportunidades recebidas aparecerão aqui. Para receber novos contatos, ative Verificado, Destaque ou Spotlight no perfil da empresa.</p>:<div className="grid gap-4">{briefs.map(b=><Link key={b.id} href={'/home/leads/'+b.id} className="rounded-xl border p-6 hover:bg-muted"><p className="text-sm text-muted-foreground">{b.buyer_user_id===user.id?'Meu pedido':'Oportunidade recebida'} · {b.status==='open'?'Aberto':'Encerrado'} · {b.offering_kind==='software'?'Software':'Serviço'}</p><h2 className="my-2 text-xl font-semibold">{b.title}</h2><p className="line-clamp-2">{b.description}</p><span className="text-sm">{new Date(b.created_at).toLocaleDateString('pt-BR')}</span></Link>)}</div>}</>;
}
export default function Page(){return <main className="mx-auto w-full max-w-5xl p-6"><h1 className="text-3xl font-semibold">Pedidos e oportunidades</h1><p className="mt-3">Acompanhe seus pedidos e converse com empresas em um só lugar.</p><Suspense fallback={<p>Carregando pedidos…</p>}><Inbox/></Suspense></main>;}

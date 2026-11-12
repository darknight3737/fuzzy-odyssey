import {Suspense} from 'react';
import {connection} from 'next/server';
import Link from 'next/link';
import {getSupabaseServerClient} from '@kit/supabase/server-client';
import {getDirectoryClient} from '~/lib/supabase/directory-client';
import {pageMetadata} from '~/lib/seo';
import {BriefForm} from './_components/brief-form';
export const metadata=pageMetadata('Encontre fornecedores para seu projeto | Selletive','Descreva sua necessidade e converse com fornecedores B2B compatíveis.','/projects/new',false);
async function ProjectForm({searchParams}:{searchParams:Promise<{providers?:string}>}){
 await connection();
 const params=await searchParams;
 const ids=(params.providers??'').split(',').filter(id=>/^[0-9a-f-]{36}$/i.test(id)).slice(0,5);
 const client=getSupabaseServerClient(); const {data:{user}}=await client.auth.getUser();
 if(!user){const next='/projects/new'+(ids.length?'?providers='+ids.join(','):'');return <div className="rounded-2xl border p-8"><h2 className="text-2xl font-semibold">Entre para enviar seu pedido</h2><p className="my-4">Sua conta permite acompanhar as conversas e proteger seus dados de contato.</p><Link className="underline" href={'/auth/sign-in?next='+encodeURIComponent(next)}>Entrar ou criar conta</Link></div>;}
 const publicClient=getDirectoryClient();
 const [{data:categories,error},{data:providers}]=await Promise.all([publicClient.from('categories').select('id,name').eq('is_active',true).order('name').limit(500),ids.length?publicClient.from('businesses').select('id,name,offering_kind').in('id',ids).in('tier',['verified','highlight','spotlight']):Promise.resolve({data:[]})]);
 if(error)throw error;
 if(ids.length&&providers?.length!==ids.length)return <p role="alert">Uma das empresas selecionadas não está disponível para receber contatos. <Link href="/search" className="underline">Escolha outros fornecedores.</Link></p>;
 return <BriefForm categories={categories??[]} providers={providers??[]} kind={providers?.length && providers.every(p=>p.offering_kind==='software')?'software':'service'} email={user.email??''}/>;
}
export default function Page(props:{searchParams:Promise<{providers?:string}>}){return <main className="container mx-auto max-w-3xl px-5 py-12"><p className="text-sm text-muted-foreground">Gratuito para quem procura</p><h1 className="my-4 text-4xl font-semibold">Encontre a solução para seu próximo projeto.</h1><p className="mb-8">Conte o que precisa, revise seu pedido e converse com fornecedores adequados.</p><Suspense fallback={<p>Carregando formulário…</p>}><ProjectForm {...props}/></Suspense></main>;}

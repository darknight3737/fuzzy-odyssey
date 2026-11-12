'use client';
import {useAction} from 'next-safe-action/hooks';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useState} from 'react';
import {Form,FormField,FormItem,FormLabel,FormControl,FormMessage} from '@kit/ui/form';
import {Button} from '@kit/ui/button';
import appConfig from '~/config/app.config';
import {verifyBadgeAction} from '../_lib/actions';
const schema=z.object({page:z.url()});
export function BadgeVerification({business}:{business:{id:string;name:string;slug:string;website:string|null;verification_status:string}}){
 const [copied,setCopied]=useState(false);
 const action=useAction(verifyBadgeAction);const form=useForm({resolver:zodResolver(schema),defaultValues:{page:business.website??''}});
 const code=action.result.data?.code;const href=new URL('/company/'+business.slug,appConfig.url).href;
 const html=code?`<a href="${href}" data-selletive-code="${code}" rel="nofollow" target="_blank">Encontre-nos na Selletive</a>`:'';
 return <section className="my-8 rounded-2xl border p-6"><p className="text-sm">Verificado gratuito</p><h2 className="my-3 text-2xl font-semibold">Conecte seu site ao perfil.</h2><p className="mb-4">Adicione o link abaixo ao site da empresa. Conferiremos o vínculo para liberar contatos e avaliações. Os selos visuais definitivos serão disponibilizados depois; o link em texto já funciona.</p><ol className="mb-5 list-inside list-decimal space-y-2"><li>Gere seu link exclusivo.</li><li>Publique o código em uma página pública do seu site.</li><li>Informe a URL final HTTPS e confira a instalação.</li></ol><Button variant="outline" disabled={action.isExecuting} onClick={()=>action.execute({businessId:business.id})}>Gerar meu link</Button>{code&&<><textarea aria-label="Código do link Selletive" readOnly value={html} rows={4} className="my-4 w-full rounded border p-3 font-mono text-xs"/><Button variant="outline" onClick={async()=>{await navigator.clipboard.writeText(html);setCopied(true);}}>{copied?'Copiado':'Copiar código'}</Button></>}<Form {...form}><form onSubmit={form.handleSubmit(v=>action.execute({businessId:business.id,page:v.page}))} className="mt-5 space-y-3"><FormField control={form.control} name="page" render={({field})=><FormItem><FormLabel>Página do seu site onde o link foi publicado</FormLabel><FormControl><input {...field} className="w-full rounded border p-3" type="url"/></FormControl><FormMessage/></FormItem>}/><Button disabled={!code||action.isExecuting}>{action.isExecuting?'Conferindo…':'Conferir instalação'}</Button></form></Form>{action.result.serverError&&<p role="alert" className="mt-4">{action.result.serverError}</p>}{action.result.data&&<p role="status" className="mt-4">{action.result.data.verified?'Vínculo confirmado. Seu perfil foi verificado.':'Instale o link no site e faça a conferência. O link precisa aparecer no HTML público da página.'}</p>}<p className="mt-4 text-xs text-muted-foreground">Vínculo confirmado significa controle do site. Não é auditoria de qualidade dos serviços ou do software. Destaque e Spotlight não exigem link externo.</p></section>;
}

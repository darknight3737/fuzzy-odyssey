'use client';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {useAction} from 'next-safe-action/hooks';
import {Form,FormField,FormItem,FormLabel,FormControl,FormMessage} from '@kit/ui/form';
import {Button} from '@kit/ui/button';
import {OfferingSchema} from '~/lib/offerings/schema';
import {createOfferingAction} from '../_lib/actions';
export function OfferingForm({categories,vendors}:{categories:{id:string;name:string}[];vendors:{id:string;name:string}[]}){
 const form=useForm({resolver:zodResolver(OfferingSchema),defaultValues:{name:'',website:'',description:'',offering_kind:'service' as 'service'|'software',vendor_business_id:'',category_ids:[] as string[]}});const action=useAction(createOfferingAction);const input='w-full rounded-xl border p-3';
 return <Form {...form}><form className="space-y-5" onSubmit={form.handleSubmit(action.execute)}>
 <FormField control={form.control} name="offering_kind" render={({field})=><FormItem><FormLabel>Tipo de perfil</FormLabel><FormControl><select {...field} className={input}><option value="service">Prestador de serviços / agência / consultoria</option><option value="software">Produto de software / SaaS</option></select></FormControl><FormMessage/></FormItem>}/>
 {(['name','website','description'] as const).map(name=><FormField key={name} control={form.control} name={name} render={({field})=><FormItem><FormLabel>{{name:'Nome da empresa ou produto',website:'Site oficial HTTPS',description:'O que sua solução faz e para quais empresas?'}[name]}</FormLabel><FormControl>{name==='description'?<textarea {...field} rows={5} className={input}/>:<input {...field} type={name==='website'?'url':'text'} className={input}/>}</FormControl><FormMessage/></FormItem>}/>) }
 <FormField control={form.control} name="vendor_business_id" render={({field})=><FormItem><FormLabel>Empresa fornecedora (opcional, para software)</FormLabel><FormControl><select {...field} className={input}><option value="">Sem vínculo</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></FormControl><FormMessage/></FormItem>}/>
 <FormField control={form.control} name="category_ids" render={({field})=><FormItem><FormLabel>Especialidades (até 10)</FormLabel><FormControl><select multiple className={input} value={field.value} onChange={e=>field.onChange(Array.from(e.target.selectedOptions).map(o=>o.value))} size={7}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FormControl><FormMessage/></FormItem>}/>
 {action.result.serverError&&<p role="alert">{action.result.serverError}</p>}<Button disabled={action.isExecuting}>Cadastrar perfil gratuito</Button><p className="text-xs text-muted-foreground">Cadastre somente ofertas B2B que você representa. Verificado confirma o vínculo com o site; planos pagos serão ativados após a configuração da cobrança.</p>
 </form></Form>;
}

'use client';
import {useAction} from 'next-safe-action/hooks';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form,FormField,FormItem,FormLabel,FormControl,FormMessage} from '@kit/ui/form';
import {Button} from '@kit/ui/button';
import {configureCrmAction,sendToCrmAction} from '../_lib/actions';
export function CrmForm({businessId,briefId}:{businessId:string;briefId:string}){
 const form=useForm({resolver:zodResolver(z.object({token:z.string().trim().min(20).max(512)})),defaultValues:{token:''}});
 const configure=useAction(configureCrmAction,{onSuccess:()=>form.reset()});const send=useAction(sendToCrmAction);
 return <details className="mt-5 rounded-xl border p-4"><summary className="cursor-pointer">Enviar contato ao HubSpot</summary><p className="my-3 text-sm">A conexão envia nome, e-mail e empresa do comprador à sua conta HubSpot quando você solicitar.</p><Form {...form}><form onSubmit={form.handleSubmit(v=>configure.execute({...v,businessId}))} className="space-y-3"><FormField name="token" control={form.control} render={({field})=><FormItem><FormLabel>Chave do aplicativo privado HubSpot</FormLabel><FormControl><input {...field} type="password" className="w-full rounded border p-2" autoComplete="off"/></FormControl><FormMessage/></FormItem>}/><Button type="submit" variant="outline" disabled={configure.isExecuting}>Salvar conexão</Button></form></Form>{configure.result.data?.success&&<p role="status">Conexão salva.</p>}{configure.result.serverError&&<p role="alert">{configure.result.serverError}</p>}<Button type="button" className="mt-3" disabled={send.isExecuting} onClick={()=>send.execute({briefId,businessId})}>Enviar ao HubSpot</Button>{send.result.data?.success&&<p role="status">{send.result.data.existing?'O contato já existe no HubSpot.':'Contato enviado.'}</p>}{send.result.serverError&&<p role="alert">{send.result.serverError}</p>}</details>;
}

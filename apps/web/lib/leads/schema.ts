import { z } from 'zod';
export const LeadSchema = z.object({
 request_id: z.uuid(), title: z.string().trim().min(3).max(200),
 description: z.string().trim().min(20).max(10000),
 buyer_name: z.string().trim().min(2).max(200), buyer_email: z.email(),
 buyer_phone: z.string().max(80), company_name: z.string().max(200),
 budget: z.string().regex(/^\d{0,9}(\.\d{1,2})?$/, 'Informe um orçamento válido.'),
 category_id: z.uuid().or(z.literal('')), offering_kind: z.enum(['service','software']),
 timeline: z.string().max(200), business_ids: z.array(z.uuid()).max(5),
 consent: z.literal(true, {error: 'Autorize o envio aos fornecedores selecionados.'}),
});
export const LeadMessageSchema = z.object({briefId:z.uuid(),businessId:z.uuid(),content:z.string().trim().min(2).max(5000)});

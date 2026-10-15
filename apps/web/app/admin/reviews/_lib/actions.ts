'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { isSuperAdmin } from '@kit/admin';
import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
export const moderateReviewAction = authActionClient.inputSchema(z.object({
    id: z.string().uuid(),
    status: z.enum(['approved', 'rejected']),
})).action(async ({ parsedInput: { id, status } }) => {
    const client = getSupabaseServerClient();
    if (!(await isSuperAdmin(client)))
        throw new Error('Unauthorized');
    const { data, error } = await client
        .from('reviews')
        .update({ status })
        .eq('id', id)
        .eq('status', 'pending')
        .select('business_id')
        .single();
    if (error)
        return { success: false };
    const { data: business } = await client
        .from('businesses')
        .select('slug')
        .eq('id', data.business_id)
        .single();
    if (business)
        revalidatePath(`/company/${business.slug}`);
    revalidatePath('/admin/reviews');
    return { success: true };
});

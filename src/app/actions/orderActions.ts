'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServiceRoleClient } from '@/infrastructure/db/supabaseClient';

const UpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid({ message: 'ID de orden inválido' }),
  status: z.enum([
    'pending_payment',
    'paid',
    'preparing',
    'ready_for_pickup',
    'delivered',
    'cancelled',
  ]),
});

export async function updateOrderStatusAction(rawInput: z.infer<typeof UpdateOrderStatusSchema>) {
  const parsed = UpdateOrderStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' };
  }

  const { orderId, status } = parsed.data;
  const client = getServiceRoleClient();

  try {
    const { error } = await client
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    revalidatePath('/historial');

    return { success: true };
  } catch (err: any) {
    console.error('Error en updateOrderStatusAction:', err);
    return { success: false, error: err.message || 'Error del servidor' };
  }
}

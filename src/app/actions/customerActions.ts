'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServiceRoleClient } from '@/infrastructure/db/supabaseClient';

const RecordAbonoSchema = z.object({
  customerId: z.string().uuid({ message: 'ID de cliente inválido' }),
  amountCop: z.number().positive({ message: 'El monto del abono debe ser mayor a 0' }),
  paymentMethod: z.enum(['efectivo', 'transferencia', 'tarjeta']),
});

export async function recordCustomerAbonoAction(rawInput: z.infer<typeof RecordAbonoSchema>) {
  const parsed = RecordAbonoSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' };
  }

  const { customerId, amountCop, paymentMethod } = parsed.data;
  const client = getServiceRoleClient();

  try {
    // 1. Insert into customer_credit_payments
    const { error: paymentErr } = await client
      .from('customer_credit_payments')
      .insert({
        customer_id: customerId,
        amount_cop: amountCop,
        payment_method: paymentMethod,
      });

    if (paymentErr) {
      console.warn('Aviso insertando en customer_credit_payments:', paymentErr.message);
    }

    // 2. Fetch current balance and reduce it
    const { data: customer, error: fetchErr } = await client
      .from('customers')
      .select('credit_balance_cop')
      .eq('id', customerId)
      .single();

    if (fetchErr || !customer) {
      return { success: false, error: 'Cliente no encontrado en base de datos' };
    }

    const currentBalance = Number(customer.credit_balance_cop || 0);
    const newBalance = Math.max(0, currentBalance - amountCop);

    const { error: updateErr } = await client
      .from('customers')
      .update({
        credit_balance_cop: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    revalidatePath('/admin');

    return {
      success: true,
      newBalance,
      appliedAmount: amountCop,
    };
  } catch (err: any) {
    console.error('Error en recordCustomerAbonoAction:', err);
    return { success: false, error: err.message || 'Error del servidor' };
  }
}

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServiceRoleClient } from '@/infrastructure/db/supabaseClient';

const PosItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  price: z.number().min(0),
  qty: z.number().int().positive(),
});

const CreatePosSaleSchema = z.object({
  customerType: z.enum(['regular', 'occasional']),
  customerName: z.string().min(1),
  customerPhone: z.string().default('300 000 0000'),
  paymentMethod: z.enum(['efectivo', 'tarjeta', 'qr', 'fiado']),
  items: z.array(PosItemSchema).min(1, 'El carrito no puede estar vacío'),
  subtotalGross: z.number().min(0),
  discountCop: z.number().min(0),
  totalFinal: z.number().min(0),
  customerId: z.string().optional(),
});

export async function createPosSaleAction(rawInput: z.infer<typeof CreatePosSaleSchema>) {
  const parsed = CreatePosSaleSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' };
  }

  const {
    customerName,
    customerPhone,
    paymentMethod,
    items,
    subtotalGross,
    discountCop,
    totalFinal,
    customerId,
  } = parsed.data;

  const client = getServiceRoleClient();
  const orderNumber = `POS-${Math.floor(10000 + Math.random() * 90000)}`;
  const pickupPin = Math.floor(1000 + Math.random() * 9000).toString();

  try {
    const notes = [
      `PIN: ${pickupPin}`,
      `Canal: POS Mostrador`,
      `Medio de Pago: ${paymentMethod}`,
      discountCop > 0 ? `Descuento Club: $${discountCop.toLocaleString('es-CO')}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    // 1. Create order record in real Supabase orders table
    const { data: order, error: orderErr } = await client
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId && customerId.length === 36 ? customerId : null,
        customer_name: customerName,
        customer_email: 'ventas.mostrador@ferromax.co',
        customer_phone: customerPhone,
        delivery_type: 'pickup',
        status: 'delivered',
        subtotal_cop: subtotalGross,
        tax_cop: Math.round(totalFinal - totalFinal / 1.19),
        shipping_cop: 0,
        total_cop: totalFinal,
        customer_notes: notes,
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error('Error insertando orden POS:', orderErr);
      return { success: false, error: `Error creando orden POS: ${orderErr?.message}` };
    }

    // 2. Insert order items
    const orderItems = items
      .filter((item) => item.id && item.id.length === 36)
      .map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_sku: item.sku,
        unit_price_cop: item.price,
        quantity: item.qty,
        subtotal_cop: item.price * item.qty,
      }));

    if (orderItems.length > 0) {
      const { error: itemsErr } = await client.from('order_items').insert(orderItems);
      if (itemsErr) {
        console.warn('Aviso insertando order_items:', itemsErr.message);
      }
    }

    // 3. Insert payment record
    const mappedPaymentMethod =
      paymentMethod === 'fiado'
        ? 'cash_on_delivery'
        : paymentMethod === 'tarjeta'
        ? 'credit_card'
        : paymentMethod === 'qr'
        ? 'pse'
        : 'cash';

    const { error: payErr } = await client.from('payments').insert({
      order_id: order.id,
      transaction_ref: `TRX-${orderNumber}`,
      payment_method: mappedPaymentMethod,
      amount_cop: totalFinal,
      status: 'approved',
      receipt_number: `REC-${orderNumber}`,
    });

    if (payErr) {
      console.warn('Aviso insertando registro de pago en payments:', payErr.message);
    }

    // 4. Decrement real stock in products table
    for (const item of items) {
      if (item.id && item.id.length === 36) {
        const { data: prod } = await client
          .from('products')
          .select('stock_quantity')
          .eq('id', item.id)
          .single();

        if (prod) {
          const newQty = Math.max(0, (prod.stock_quantity || 0) - item.qty);
          await client
            .from('products')
            .update({
              stock_quantity: newQty,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
        }
      }
    }

    revalidatePath('/admin');
    revalidatePath('/catalogo');
    revalidatePath('/historial');

    return {
      success: true,
      order: {
        id: order.id,
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: '',
        channel: 'pos',
        delivery_type: 'pickup',
        status: 'delivered',
        pickup_pin: pickupPin,
        payment_method: paymentMethod,
        items_summary: items.map((i) => `${i.qty}x ${i.name}`).join(', '),
        total_cop: totalFinal,
        created_at: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    console.error('Error en createPosSaleAction:', err);
    return { success: false, error: errorMsg };
  }
}

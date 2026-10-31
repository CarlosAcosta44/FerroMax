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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    console.error('Error en updateOrderStatusAction:', err);
    return { success: false, error: errorMsg };
  }
}

const WebOrderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productSku: z.string(),
  unitPriceCop: z.number().min(0),
  quantity: z.number().int().positive(),
  subtotalCop: z.number().min(0),
});

const CreateWebOrderSchema = z.object({
  customerName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  customerEmail: z.string().email({ message: 'Correo electrónico inválido' }),
  customerPhone: z.string().min(7, { message: 'El teléfono debe tener al menos 7 dígitos' }),
  deliveryType: z.enum(['pickup', 'delivery']),
  deliveryAddress: z.string().optional().nullable(),
  paymentMethod: z.enum(['efectivo', 'transferencia', 'pse', 'webpay']).default('efectivo'),
  customerNotes: z.string().optional().nullable(),
  items: z.array(WebOrderItemSchema).min(1, { message: 'El carrito debe tener al menos un producto' }),
  subtotalCop: z.number().min(0),
  shippingCop: z.number().min(0),
  totalCop: z.number().min(0),
  customerId: z.string().optional().nullable(),
});

export async function createWebOrderAction(rawInput: z.infer<typeof CreateWebOrderSchema>) {
  const parsed = CreateWebOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' };
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    deliveryType,
    deliveryAddress,
    paymentMethod,
    customerNotes,
    items,
    subtotalCop,
    shippingCop,
    totalCop,
    customerId,
  } = parsed.data;

  const client = getServiceRoleClient();
  const year = new Date().getFullYear();
  const orderNumber = `FM-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  const pickupPin = Math.floor(1000 + Math.random() * 9000).toString();

  try {
    const combinedNotes = [
      `PIN: ${pickupPin}`,
      `Canal: Web Online`,
      `Entrega: ${deliveryType === 'pickup' ? 'Retiro en Mesón' : 'Despacho a Domicilio'}`,
      `Medio de Pago: ${paymentMethod}`,
      customerNotes || null,
    ]
      .filter(Boolean)
      .join(' | ');

    // 1. Insert order into orders table
    const { data: order, error: orderErr } = await client
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId && customerId.length === 36 ? customerId : null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        order_origin: 'web',
        channel: 'web',
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress || null : null,
        status: 'preparing',
        pickup_pin: pickupPin,
        payment_method: paymentMethod,
        subtotal_cop: subtotalCop,
        tax_cop: Math.round(totalCop - totalCop / 1.19),
        shipping_cop: shippingCop,
        total_cop: totalCop,
        customer_notes: combinedNotes,
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error('Error creando orden web en Supabase:', orderErr);
      return { success: false, error: `Error creando orden: ${orderErr?.message || 'Error desconocido'}` };
    }

    // 2. Insert items into order_items table
    const orderItemsToInsert = items
      .filter((i) => i.productId && i.productId.length === 36)
      .map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        product_name: i.productName,
        product_sku: i.productSku,
        unit_price_cop: i.unitPriceCop,
        quantity: i.quantity,
        subtotal_cop: i.subtotalCop,
      }));

    if (orderItemsToInsert.length > 0) {
      const { error: itemsErr } = await client.from('order_items').insert(orderItemsToInsert);
      if (itemsErr) {
        console.warn('Aviso insertando order_items:', itemsErr.message);
      }
    }

    // 3. Insert payment record into payments table
    const mappedPaymentMethod =
      paymentMethod === 'transferencia'
        ? 'bank_transfer'
        : paymentMethod === 'pse'
        ? 'pse'
        : 'cash';

    const { error: payErr } = await client.from('payments').insert({
      order_id: order.id,
      transaction_ref: `TRX-${orderNumber}`,
      payment_method: mappedPaymentMethod,
      amount_cop: totalCop,
      status: paymentMethod === 'efectivo' ? 'pending' : 'approved',
      receipt_number: `REC-${orderNumber}`,
      gateway_payload: {
        channel: 'web',
        delivery_type: deliveryType,
        customer_phone: customerPhone,
      },
    });

    if (payErr) {
      console.warn('Aviso insertando registro en payments:', payErr.message);
    }

    // 4. Decrement real stock in products table
    for (const item of items) {
      if (item.productId && item.productId.length === 36) {
        const { data: prod } = await client
          .from('products')
          .select('stock_quantity')
          .eq('id', item.productId)
          .single();

        if (prod) {
          const newQty = Math.max(0, (prod.stock_quantity || 0) - item.quantity);
          await client
            .from('products')
            .update({
              stock_quantity: newQty,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.productId);
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
        orderNumber,
        pickupPin,
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : null,
        totalCop,
        customerName,
        customerPhone,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    console.error('Error en createWebOrderAction:', err);
    return { success: false, error: errorMsg };
  }
}

import { z } from 'zod';

export const CreateOrderSchema = z.object({
  customerName: z.string().min(3, 'Nombre requerido'),
  customerEmail: z.string().email('Correo electrónico inválido'),
  customerPhone: z.string().min(7, 'Teléfono requerido'),
  deliveryType: z.enum(['pickup', 'delivery']),
  deliveryAddress: z.string().optional(),
  customerNotes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      productName: z.string(),
      productSku: z.string(),
      unitPriceCop: z.number().positive(),
      quantity: z.number().int().positive(),
      subtotalCop: z.number().positive(),
    })
  ).min(1, 'El pedido debe tener al menos un producto'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

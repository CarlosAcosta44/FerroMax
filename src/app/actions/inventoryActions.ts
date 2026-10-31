'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServiceRoleClient } from '@/infrastructure/db/supabaseClient';

const UpdateStockSchema = z.object({
  productId: z.string().min(1, { message: 'ID de producto inválido' }),
  delta: z.number().int().optional(),
  exactStock: z.number().int().min(0, { message: 'El stock no puede ser negativo' }).optional(),
});

const UpdatePriceSchema = z.object({
  productId: z.string().min(1, { message: 'ID de producto inválido' }),
  newPriceCop: z.number().min(0, { message: 'El precio debe ser mayor o igual a 0' }),
});

export async function updateStockAction(rawInput: z.infer<typeof UpdateStockSchema>) {
  const parsed = UpdateStockSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' };
  }

  const { productId, delta, exactStock } = parsed.data;
  const client = getServiceRoleClient();

  try {
    let finalStock: number;

    if (exactStock !== undefined) {
      finalStock = exactStock;
    } else if (delta !== undefined) {
      const { data: current, error: fetchErr } = await client
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (fetchErr || !current) {
        return { success: false, error: 'Producto no encontrado' };
      }
      finalStock = Math.max(0, (Number(current.stock_quantity) || 0) + delta);
    } else {
      return { success: false, error: 'Debe especificar delta o exactStock' };
    }

    const { error: updateErr } = await client
      .from('products')
      .update({
        stock_quantity: finalStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (updateErr) {
      console.error('Error actualizando stock en Supabase:', updateErr.message);
      return { success: false, error: updateErr.message };
    }

    revalidatePath('/catalogo');
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true, finalStock };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    console.error('Error en updateStockAction:', err);
    return { success: false, error: errorMsg };
  }
}

export async function updatePriceAction(rawInput: z.infer<typeof UpdatePriceSchema>) {
  const parsed = UpdatePriceSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' };
  }

  const { productId, newPriceCop } = parsed.data;
  const client = getServiceRoleClient();

  try {
    const { error } = await client
      .from('products')
      .update({
        price_cop: newPriceCop,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) {
      console.error('Error actualizando precio en Supabase:', error.message);
      return { success: false, error: error.message };
    }

    revalidatePath('/catalogo');
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    console.error('Error en updatePriceAction:', err);
    return { success: false, error: errorMsg };
  }
}

export async function toggleProductActiveAction(productId: string, isActive: boolean) {
  const client = getServiceRoleClient();
  try {
    const { error } = await client
      .from('products')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/catalogo');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error del servidor';
    return { success: false, error: errorMsg };
  }
}

export async function editProductAction(params: {
  id: string;
  name: string;
  price_cop: number;
  cost_price_cop?: number;
  stock_quantity: number;
  min_stock_alert: number;
  description?: string;
}) {
  const client = getServiceRoleClient();
  try {
    const { error } = await client
      .from('products')
      .update({
        name: params.name,
        price_cop: params.price_cop,
        cost_price_cop: params.cost_price_cop ?? 0,
        stock_quantity: params.stock_quantity,
        min_stock_alert: params.min_stock_alert,
        ...(params.description ? { description: params.description } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (error) {
      console.error('Error al editar producto en Supabase:', error.message);
      return { success: false, error: error.message };
    }

    revalidatePath('/catalogo');
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error al editar producto';
    return { success: false, error: errorMsg };
  }
}

export async function deleteProductAction(productId: string) {
  const client = getServiceRoleClient();
  try {
    // Intentar eliminación directa
    const { error } = await client.from('products').delete().eq('id', productId);
    if (error) {
      // Si tiene restricciones de clave foránea con order_items, hacer soft-delete
      console.warn('Eliminación física restringida por órdenes previas. Aplicando desactivación lógica (is_active = false):', error.message);
      const { error: softErr } = await client
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (softErr) {
        return { success: false, error: softErr.message };
      }
    }

    revalidatePath('/catalogo');
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error al eliminar producto';
    return { success: false, error: errorMsg };
  }
}

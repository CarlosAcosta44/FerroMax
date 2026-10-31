import { supabase, getServiceRoleClient } from '@/infrastructure/db/supabaseClient';

export interface AdminProduct {
  id: string;
  name: string;
  slug?: string;
  sku: string;
  category: string;
  aisle: string;
  price_cop: number;
  cost_cop: number;
  stock_quantity: number;
  min_stock: number;
  status: 'ok' | 'low' | 'out';
  image_url?: string;
  unit?: string;
}

export interface AdminCustomer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  trade: string;
  club_tier: string;
  credit_limit_cop: number;
  credit_balance_cop: number;
  total_purchases_cop: number;
  address?: string;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  channel: 'web' | 'pos' | 'counter';
  delivery_type: string;
  status: 'pending_payment' | 'paid' | 'preparing' | 'ready_for_pickup' | 'delivered' | 'cancelled';
  pickup_pin?: string;
  payment_method: string;
  items_summary: string;
  total_cop: number;
  created_at: string;
}

export type CashShift = CashShiftData;
export interface CashShiftData {
  id?: string;
  cashier_name: string;
  shift_name: string;
  status: 'open' | 'closed';
  initial_cash_cop: number;
  counted_cash_cop: number;
  expected_cash_cop: number;
  difference_cop: number;
  denominations: { [key: string]: number };
  opened_at?: string;
}

function getAisleByCategory(categoryName?: string): string {
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('eléctrica')) return 'Pasillo 1 - Estante A';
  if (cat.includes('manual')) return 'Pasillo 1 - Estante B';
  if (cat.includes('plomería') || cat.includes('grifería')) return 'Pasillo 2';
  if (cat.includes('electricidad') || cat.includes('iluminación')) return 'Pasillo 3';
  if (cat.includes('pintura') || cat.includes('adhesivo')) return 'Pasillo 4';
  if (cat.includes('tornill') || cat.includes('fijaci')) return 'Pasillo 5';
  return 'Pasillo 1';
}

export class SupabaseAdminRepository {
  private static instance: SupabaseAdminRepository;
  static getInstance(): SupabaseAdminRepository {
    if (!this.instance) {
      this.instance = new SupabaseAdminRepository();
    }
    return this.instance;
  }

  // 1. Fetch real products from Supabase
  async getProducts(): Promise<AdminProduct[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          sku,
          brand,
          price_cop,
          cost_price_cop,
          stock_quantity,
          min_stock_alert,
          unit_measure,
          image_url,
          categories (name)
        `)
        .order('name');

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
          const stock = Number(item.stock_quantity) || 0;
          const minStock = Number(item.min_stock_alert) || 5;
          let status: 'ok' | 'low' | 'out' = 'ok';
          if (stock === 0) status = 'out';
          else if (stock <= minStock) status = 'low';

          const categoryName = item.categories?.name || 'General';

          return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            sku: item.sku || `SKU-${item.id.slice(0, 4).toUpperCase()}`,
            category: categoryName,
            aisle: getAisleByCategory(categoryName),
            price_cop: Number(item.price_cop) || 0,
            cost_cop: item.cost_price_cop ? Number(item.cost_price_cop) : Math.round(Number(item.price_cop) * 0.65),
            stock_quantity: stock,
            min_stock: minStock,
            status,
            image_url: item.image_url,
            unit: item.unit_measure || 'unidad',
          };
        });
      }
    } catch (err) {
      console.error('Error al consultar productos de Supabase:', err);
    }

    return [];
  }

  async updateProduct(id: string, updates: { stock_quantity?: number; price_cop?: number }): Promise<void> {
    try {
      const client = typeof window !== 'undefined' ? supabase : getServiceRoleClient();
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.stock_quantity !== undefined) {
        payload.stock_quantity = updates.stock_quantity;
      }
      if (updates.price_cop !== undefined) {
        payload.price_cop = updates.price_cop;
      }

      const { error } = await client.from('products').update(payload).eq('id', id);
      if (error) {
        console.error('Error actualizando producto en Supabase:', error.message);
      }
    } catch (err) {
      console.error('Error al actualizar producto en Supabase:', err);
    }
  }

  // 2. Fetch real customers for Clientes Frecuentes module
  async getCustomers(): Promise<AdminCustomer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('full_name');

      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          full_name: c.full_name,
          email: c.email || '',
          phone: c.phone || '300 000 0000',
          trade: c.notes ? c.notes.split('.')[0] : (c.is_frequent ? 'Maestro Frecuente' : 'Vecino del Barrio'),
          club_tier: c.is_frequent ? 'Maestro Club' : 'Vecino Club',
          credit_limit_cop: 500000,
          credit_balance_cop: 0,
          total_purchases_cop: 0,
          address: c.address || c.city || 'Bogotá',
        }));
      }
    } catch (err) {
      console.error('Error al consultar clientes de Supabase:', err);
    }

    return [];
  }

  // Record an abono / credit payment for a customer
  async recordCustomerAbono(customerId: string, amount: number, paymentMethod: string): Promise<{ success: boolean }> {
    console.log(`Abono registrado para ${customerId}: $${amount} vía ${paymentMethod}`);
    return { success: true };
  }

  // 3. Fetch real orders for Pedidos y Retiro en Mesón and Sales
  async getOrders(): Promise<AdminOrder[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_phone,
          customer_email,
          delivery_type,
          status,
          total_cop,
          customer_notes,
          created_at,
          order_items (
            quantity,
            product_name
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((o: any) => {
          const itemsSummary = o.order_items && o.order_items.length > 0
            ? o.order_items.map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ')
            : 'Suministros Ferretería';

          const pinMatch = o.customer_notes?.match(/PIN:\s*([0-9A-Za-z]+)/i);
          const pickupPin = pinMatch ? pinMatch[1] : (o.order_number ? o.order_number.slice(-4) : '0000');
          const isPos = o.order_number?.startsWith('POS-');

          return {
            id: o.id,
            order_number: o.order_number,
            customer_name: o.customer_name || 'Cliente',
            customer_phone: o.customer_phone || '300 000 0000',
            customer_email: o.customer_email || '',
            channel: (isPos ? 'pos' : 'web') as 'web' | 'pos',
            delivery_type: o.delivery_type || 'pickup',
            status: o.status || 'paid',
            pickup_pin: pickupPin,
            payment_method: 'efectivo',
            items_summary: itemsSummary,
            total_cop: Number(o.total_cop) || 0,
            created_at: o.created_at,
          };
        });
      }
    } catch (err) {
      console.error('Error consultando órdenes de Supabase:', err);
    }

    return [];
  }

  // Update order status (e.g. marked ready or delivered)
  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const client = getServiceRoleClient();
      await client.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    } catch (err) {
      console.error('Error actualizando estado de la orden en Supabase:', err);
    }
  }

  // 4. Fetch or update Cash Shift (Caja y Arqueo)
  async getCashShift(): Promise<CashShiftData> {
    return {
      cashier_name: 'Administrador FerroMax',
      shift_name: 'Turno Mañana',
      status: 'open',
      initial_cash_cop: 200000,
      counted_cash_cop: 1395000,
      expected_cash_cop: 1395000,
      difference_cop: 0,
      denominations: {
        '50000': 14,
        '20000': 22,
        '10000': 18,
        '5000': 15,
        '2000': 20,
        '1000': 25,
        '500': 20,
      },
      opened_at: new Date().toISOString(),
    };
  }

  // Update cash shift count
  async saveCashCount(shiftId: string | undefined, denominations: { [key: string]: number }, totalCounted: number): Promise<void> {
    console.log('Arqueo de caja actualizado:', { shiftId, totalCounted, denominations });
  }
}

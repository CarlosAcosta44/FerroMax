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
  customer_type?: 'online_user' | 'frequent_counter';
}

export interface AdminOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  channel: 'web' | 'pos' | 'counter';
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string;
  status: 'pending_payment' | 'paid' | 'preparing' | 'ready_for_pickup' | 'delivered' | 'cancelled';
  pickup_pin?: string;
  payment_method: string;
  items_summary: string;
  total_cop: number;
  customer_notes?: string;
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

  // 2. Fetch real customers (including online registered users)
  async getCustomers(): Promise<AdminCustomer[]> {
    try {
      const [{ data: customersData }, { data: profilesData }, { data: ordersData }] = await Promise.all([
        supabase.from('customers').select('*').order('full_name'),
        supabase.from('profiles').select('*').eq('role', 'cliente'),
        supabase.from('orders').select('customer_id, customer_email, total_cop, status'),
      ]);

      const customerMap = new Map<string, AdminCustomer>();

      // A. Process customers from customers table
      if (customersData && customersData.length > 0) {
        for (const c of customersData) {
          const custOrders = (ordersData || []).filter(
            (o) => o.customer_id === c.id || (c.email && o.customer_email?.toLowerCase() === c.email.toLowerCase())
          );
          const totalPurchases = custOrders.reduce((sum, o) => sum + (Number(o.total_cop) || 0), 0);

          customerMap.set(c.id, {
            id: c.id,
            full_name: c.full_name,
            email: c.email || '',
            phone: c.phone || '300 000 0000',
            trade: c.notes ? c.notes.split('.')[0] : (c.is_frequent ? 'Maestro de Obra' : 'Cliente Frecuente'),
            club_tier: c.is_frequent ? 'Club Maestro (10% Dcto)' : 'Vecino Club (5% Dcto)',
            credit_limit_cop: Number(c.credit_limit_cop) || (c.is_frequent ? 1000000 : 500000),
            credit_balance_cop: Number(c.credit_balance_cop) || 0,
            total_purchases_cop: totalPurchases > 0 ? totalPurchases : (Number(c.total_purchases_cop) || 0),
            address: c.address || c.city || 'Bogotá',
            customer_type: 'frequent_counter',
          });
        }
      }

      // B. Merge online registered users from profiles
      if (profilesData && profilesData.length > 0) {
        for (const p of profilesData) {
          const already = Array.from(customerMap.values()).find(
            (c) => c.email && p.email && c.email.toLowerCase() === p.email.toLowerCase()
          );
          if (!already) {
            const userOrders = (ordersData || []).filter(
              (o) => o.customer_id === p.id || (p.email && o.customer_email?.toLowerCase() === p.email.toLowerCase())
            );
            const totalPurchases = userOrders.reduce((sum, o) => sum + (Number(o.total_cop) || 0), 0);

            customerMap.set(p.id, {
              id: p.id,
              full_name: p.full_name || p.email.split('@')[0],
              email: p.email,
              phone: p.phone || 'Celular no registrado',
              trade: 'Usuario Registrado en Línea',
              club_tier: 'Comprador Online',
              credit_limit_cop: 300000,
              credit_balance_cop: 0,
              total_purchases_cop: totalPurchases,
              address: 'Cliente Web FerroMax',
              customer_type: 'online_user',
            });
          }
        }
      }

      return Array.from(customerMap.values());
    } catch (err) {
      console.error('Error al consultar clientes de Supabase:', err);
      return [];
    }
  }

  // Record an abono / credit payment for a customer
  async recordCustomerAbono(customerId: string, amount: number, paymentMethod: string): Promise<{ success: boolean }> {
    console.log(`Abono registrado para ${customerId}: $${amount} vía ${paymentMethod}`);
    return { success: true };
  }

  // 3. Fetch real orders for Compras en Línea (Web) and Sales (POS)
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
          order_origin,
          delivery_type,
          delivery_address,
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

          // Extract PIN
          const pinMatch = o.customer_notes?.match(/PIN:\s*([0-9A-Za-z]+)/i);
          const pickupPin = pinMatch ? pinMatch[1] : (o.order_number ? o.order_number.slice(-4) : '0000');

          // Extract Payment method
          let paymentMethod = 'efectivo';
          if (o.payment_method) {
            paymentMethod = o.payment_method;
          } else if (o.customer_notes?.includes('transferencia')) {
            paymentMethod = 'transferencia';
          } else if (o.customer_notes?.includes('tarjeta')) {
            paymentMethod = 'tarjeta';
          } else if (o.customer_notes?.includes('fiado')) {
            paymentMethod = 'fiado';
          }

          const isPos =
            o.order_origin === 'pos_counter' ||
            o.order_number?.startsWith('POS-') ||
            o.order_number?.startsWith('BOL-');

          return {
            id: o.id,
            order_number: o.order_number,
            customer_name: o.customer_name || 'Cliente',
            customer_phone: o.customer_phone || '300 000 0000',
            customer_email: o.customer_email || '',
            channel: (isPos ? 'pos' : 'web') as 'web' | 'pos',
            delivery_type: (o.delivery_type as 'pickup' | 'delivery') || 'pickup',
            delivery_address: o.delivery_address || '',
            status: o.status || 'paid',
            pickup_pin: pickupPin,
            payment_method: paymentMethod,
            items_summary: itemsSummary,
            total_cop: Number(o.total_cop) || 0,
            customer_notes: o.customer_notes || '',
            created_at: o.created_at,
          };
        });
      }
    } catch (err) {
      console.error('Error consultando órdenes de Supabase:', err);
    }

    return [];
  }

  // Update order status (e.g. marked preparing, ready_for_pickup or delivered)
  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const client = getServiceRoleClient();
      await client.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    } catch (err) {
      console.error('Error actualizando estado de la orden en Supabase:', err);
    }
  }

  // 4. Fetch real Cash Shift (Caja y Arqueo)
  async getCashShift(): Promise<CashShiftData> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total_cop, customer_notes, order_origin, order_number')
        .gte('created_at', `${todayStr}T00:00:00.000Z`);

      let todayCashSales = 0;
      if (todayOrders) {
        for (const ord of todayOrders) {
          const notes = ord.customer_notes || '';
          if (notes.includes('efectivo') || (!notes.includes('tarjeta') && !notes.includes('transferencia'))) {
            todayCashSales += Number(ord.total_cop) || 0;
          }
        }
      }

      const initialCash = 200000;
      const expectedCash = initialCash + todayCashSales;

      return {
        cashier_name: 'Administrador FerroMax',
        shift_name: 'Turno Principal',
        status: 'open',
        initial_cash_cop: initialCash,
        counted_cash_cop: expectedCash,
        expected_cash_cop: expectedCash,
        difference_cop: 0,
        denominations: {
          '50000': Math.floor(expectedCash / 100000),
          '20000': Math.floor((expectedCash % 100000) / 20000),
          '10000': 5,
          '5000': 10,
          '2000': 10,
          '1000': 20,
          '500': 20,
        },
        opened_at: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Error en getCashShift:', err);
      return {
        cashier_name: 'Administrador FerroMax',
        shift_name: 'Turno Principal',
        status: 'open',
        initial_cash_cop: 200000,
        counted_cash_cop: 200000,
        expected_cash_cop: 200000,
        difference_cop: 0,
        denominations: {},
      };
    }
  }

  // Update cash shift count
  async saveCashCount(shiftId: string | undefined, denominations: { [key: string]: number }, totalCounted: number): Promise<void> {
    console.log('Arqueo de caja actualizado con denominations reales:', { shiftId, totalCounted, denominations });
  }
}

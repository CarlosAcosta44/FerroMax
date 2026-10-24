import { supabase } from '@/infrastructure/db/supabaseClient';

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

export class SupabaseAdminRepository {
  private static instance: SupabaseAdminRepository;
  static getInstance(): SupabaseAdminRepository {
    if (!this.instance) {
      this.instance = new SupabaseAdminRepository();
    }
    return this.instance;
  }
  // 1. Fetch real products for inventory module
  async getProducts(): Promise<AdminProduct[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          sku,
          price_cop,
          stock_quantity,
          image_url,
          unit,
          aisle,
          cost_cop,
          min_stock,
          categories (name)
        `)
        .order('name');

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
          const stock = item.stock_quantity ?? 0;
          const minStock = item.min_stock ?? 5;
          let status: 'ok' | 'low' | 'out' = 'ok';
          if (stock === 0) status = 'out';
          else if (stock <= minStock) status = 'low';

          return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            sku: item.sku || `SKU-${item.id.slice(0, 4).toUpperCase()}`,
            category: item.categories?.name || 'General',
            aisle: item.aisle || 'Pasillo 1',
            price_cop: Number(item.price_cop) || 0,
            cost_cop: Number(item.cost_cop) || Math.round(Number(item.price_cop) * 0.65),
            stock_quantity: stock,
            min_stock: minStock,
            status,
            image_url: item.image_url,
            unit: item.unit || 'unidad',
          };
        });
      }
    } catch (err) {
      console.warn('Error fetching products from Supabase, using defaults:', err);
    }

    return this.getDefaultProducts();
  }

  // Update stock or price in Supabase
  async updateProduct(id: string, updates: { stock_quantity?: number; price_cop?: number; status?: string }): Promise<void> {
    try {
      await supabase.from('products').update(updates).eq('id', id);
    } catch (err) {
      console.error('Error updating product in Supabase:', err);
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
          trade: c.trade || 'Vecino del Barrio',
          club_tier: c.club_tier || 'Vecino Club',
          credit_limit_cop: Number(c.credit_limit_cop) || 500000,
          credit_balance_cop: Number(c.credit_balance_cop) || 0,
          total_purchases_cop: Number(c.total_purchases_cop) || 0,
          address: c.address || '',
        }));
      }
    } catch (err) {
      console.warn('Error fetching customers from Supabase:', err);
    }

    return this.getDefaultCustomers();
  }

  // Record an abono / credit payment for a customer
  async recordCustomerAbono(customerId: string, amount: number, paymentMethod: string): Promise<{ success: boolean }> {
    try {
      // Insert payment
      await supabase.from('customer_credit_payments').insert({
        customer_id: customerId,
        amount_cop: amount,
        payment_method: paymentMethod,
      });

      // Fetch current balance and reduce it
      const { data } = await supabase.from('customers').select('credit_balance_cop').eq('id', customerId).single();
      if (data) {
        const newBalance = Math.max(0, Number(data.credit_balance_cop || 0) - amount);
        await supabase.from('customers').update({ credit_balance_cop: newBalance }).eq('id', customerId);
      }
    } catch (err) {
      console.error('Error recording abono in Supabase:', err);
      return { success: false };
    }
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
          channel,
          delivery_type,
          status,
          pickup_pin,
          payment_method,
          total_cop,
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

          return {
            id: o.id,
            order_number: o.order_number,
            customer_name: o.customer_name || 'Cliente',
            customer_phone: o.customer_phone || '300 000 0000',
            customer_email: o.customer_email || '',
            channel: o.channel || 'web',
            delivery_type: o.delivery_type || 'pickup',
            status: o.status || 'paid',
            pickup_pin: o.pickup_pin || o.order_number.slice(-4),
            payment_method: o.payment_method || 'efectivo',
            items_summary: itemsSummary,
            total_cop: Number(o.total_cop) || 0,
            created_at: o.created_at,
          };
        });
      }
    } catch (err) {
      console.warn('Error fetching orders from Supabase:', err);
    }

    return this.getDefaultOrders();
  }

  // Update order status (e.g. marked ready or delivered)
  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
    } catch (err) {
      console.error('Error updating order status in Supabase:', err);
    }
  }

  // 4. Fetch or update Cash Shift (Caja y Arqueo)
  async getCashShift(): Promise<CashShiftData> {
    try {
      const { data, error } = await supabase
        .from('cash_shifts')
        .select('*')
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          cashier_name: data.cashier_name,
          shift_name: data.shift_name,
          status: data.status,
          initial_cash_cop: Number(data.initial_cash_cop) || 200000,
          counted_cash_cop: Number(data.counted_cash_cop) || 0,
          expected_cash_cop: Number(data.expected_cash_cop) || 0,
          difference_cop: Number(data.difference_cop) || 0,
          denominations: data.denominations_json || {
            '50000': 14,
            '20000': 22,
            '10000': 18,
            '5000': 15,
            '2000': 20,
            '1000': 25,
            '500': 20,
          },
          opened_at: data.opened_at,
        };
      }
    } catch (err) {
      console.warn('Error fetching cash shift from Supabase:', err);
    }

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

  // Update cash shift count in Supabase
  async saveCashCount(shiftId: string | undefined, denominations: { [key: string]: number }, totalCounted: number): Promise<void> {
    try {
      if (shiftId) {
        await supabase.from('cash_shifts').update({
          counted_cash_cop: totalCounted,
          denominations_json: denominations,
          difference_cop: totalCounted - 1395000,
        }).eq('id', shiftId);
      }
    } catch (err) {
      console.error('Error saving cash count:', err);
    }
  }

  // 5. Default Fallbacks matching designs
  private getDefaultProducts(): AdminProduct[] {
    return [
      {
        id: '1',
        name: 'Taladro Percutor Casero 650W DeWalt',
        sku: 'HERR-001',
        category: 'Herramientas Caseras',
        aisle: 'Pasillo 1 - Estante A',
        price_cop: 385000,
        cost_cop: 250000,
        stock_quantity: 12,
        min_stock: 4,
        status: 'ok',
        image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
        unit: 'caja',
      },
      {
        id: '2',
        name: 'Juego de Destornilladores x6 Stanley',
        sku: 'HERR-002',
        category: 'Herramientas Caseras',
        aisle: 'Pasillo 1 - Estante B',
        price_cop: 48900,
        cost_cop: 29000,
        stock_quantity: 18,
        min_stock: 5,
        status: 'ok',
        image_url: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&w=400&q=80',
        unit: 'set',
      },
      {
        id: '3',
        name: 'Cinta Teflón 3/4" x 10m Alta Densidad',
        sku: 'PLOM-001',
        category: 'Plomería y Grifería',
        aisle: 'Pasillo 2 - Grifería',
        price_cop: 4500,
        cost_cop: 2200,
        stock_quantity: 4,
        min_stock: 8,
        status: 'low',
        image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80',
        unit: 'rollo',
      },
      {
        id: '4',
        name: 'Esmalte Sintético Blanco Brillante 1 Gal',
        sku: 'PINT-001',
        category: 'Pinturas y Adhesivos',
        aisle: 'Pasillo 3 - Pinturas',
        price_cop: 68000,
        cost_cop: 44000,
        stock_quantity: 3,
        min_stock: 5,
        status: 'low',
        image_url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80',
        unit: 'galón',
      },
      {
        id: '5',
        name: 'Tubo Sanitario PVC 2" x 3m Pavco',
        sku: 'PLOM-002',
        category: 'Plomería y Grifería',
        aisle: 'Patio Posterior',
        price_cop: 34500,
        cost_cop: 21000,
        stock_quantity: 0,
        min_stock: 6,
        status: 'out',
        image_url: 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?auto=format&fit=crop&w=400&q=80',
        unit: 'tubo',
      },
      {
        id: '6',
        name: 'Caja Tornillos Drywall 6x1 (500 und)',
        sku: 'FIJ-001',
        category: 'Tornillería y Fijaciones',
        aisle: 'Pasillo 4 - Gaveta 12',
        price_cop: 28000,
        cost_cop: 15000,
        stock_quantity: 25,
        min_stock: 10,
        status: 'ok',
        image_url: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?auto=format&fit=crop&w=400&q=80',
        unit: 'caja',
      },
    ];
  }

  private getDefaultCustomers(): AdminCustomer[] {
    return [
      {
        id: 'c1',
        full_name: 'Hernán Morales',
        email: 'hernan.constructor@gmail.com',
        phone: '312 841 9011',
        trade: 'Maestro de Obra Constructor',
        club_tier: 'Club Maestro Oro (10% Dcto)',
        credit_limit_cop: 800000,
        credit_balance_cop: 148900,
        total_purchases_cop: 3450000,
        address: 'Pasaje Los Aromos #340',
      },
      {
        id: 'c2',
        full_name: 'Pedro Morales',
        email: 'pedro.morales@hotmail.com',
        phone: '315 712 4433',
        trade: 'Vecino Pasaje',
        club_tier: 'Club Maestro Vecinal (5% Dcto)',
        credit_limit_cop: 300000,
        credit_balance_cop: 25980,
        total_purchases_cop: 890000,
        address: 'Av. Central #1120',
      },
      {
        id: 'c3',
        full_name: 'Construcciones Del Valle S.A.S',
        email: 'compras@valleconstrucciones.com',
        phone: '300 555 4321',
        trade: 'Empresa Contratista Local',
        club_tier: 'Tarifa Constructor (15% Dcto)',
        credit_limit_cop: 2500000,
        credit_balance_cop: 0,
        total_purchases_cop: 12800000,
        address: 'Zona Industrial Manzana 4',
      },
      {
        id: 'c4',
        full_name: 'Carla Rivas (Comité Vecinal)',
        email: 'juntadevecinos12@gmail.com',
        phone: '310 655 1120',
        trade: 'Junta de Vecinos',
        club_tier: 'Cuenta Institucional',
        credit_limit_cop: 500000,
        credit_balance_cop: 85000,
        total_purchases_cop: 1450000,
        address: 'Unidad Vecinal #12 Los Cipreses',
      },
      {
        id: 'c5',
        full_name: 'Jaime Rincón',
        email: 'jaime.rincon.electric@gmail.com',
        phone: '314 999 1122',
        trade: 'Electricista Certificado',
        club_tier: 'Club Electricista (10% Dcto)',
        credit_limit_cop: 600000,
        credit_balance_cop: 45000,
        total_purchases_cop: 2100000,
        address: 'Calle 28 #14-08',
      },
    ];
  }

  private getDefaultOrders(): AdminOrder[] {
    return [
      {
        id: 'o1',
        order_number: 'FM-2025-001',
        customer_name: 'Juan Carlos Pérez',
        customer_phone: '310 987 6543',
        customer_email: 'juan.perez@gmail.com',
        channel: 'web',
        delivery_type: 'pickup',
        status: 'ready_for_pickup',
        pickup_pin: '7492',
        payment_method: 'webpay',
        items_summary: '1x Taladro Percutor 650W + 1x Broca Concreto 1/4"',
        total_cop: 395000,
        created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      },
      {
        id: 'o2',
        order_number: 'FM-2025-002',
        customer_name: 'Construcciones del Valle',
        customer_phone: '300 555 4321',
        customer_email: 'compras@valleconstrucciones.com',
        channel: 'web',
        delivery_type: 'pickup',
        status: 'preparing',
        pickup_pin: '1024',
        payment_method: 'transferencia',
        items_summary: '1x Caja Tornillos Drywall + 2x Cinta Teflón 3/4"',
        total_cop: 32500,
        created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      },
      {
        id: 'o3',
        order_number: 'FM-2025-003',
        customer_name: 'Andrés Morales (Maestro)',
        customer_phone: '315 444 8899',
        customer_email: 'andres.morales@gmail.com',
        channel: 'web',
        delivery_type: 'pickup',
        status: 'delivered',
        pickup_pin: '5561',
        payment_method: 'efectivo',
        items_summary: '2x Esmalte Sintético Blanco 1 Gal',
        total_cop: 136000,
        created_at: new Date(Date.now() - 120 * 60000).toISOString(),
      },
      {
        id: 'o4',
        order_number: 'BOL-10492',
        customer_name: 'Juan Pérez (Vecino Pasaje 3)',
        customer_phone: '310 987 6543',
        customer_email: '',
        channel: 'pos',
        delivery_type: 'pickup',
        status: 'delivered',
        pickup_pin: '4920',
        payment_method: 'efectivo',
        items_summary: '1x Cinta Aislante 3M + 2x Pila Alcalina AA',
        total_cop: 39000,
        created_at: new Date(Date.now() - 30 * 60000).toISOString(),
      },
      {
        id: 'o5',
        order_number: 'BOL-10493',
        customer_name: 'Hernán Morales',
        customer_phone: '312 841 9011',
        customer_email: 'hernan.constructor@gmail.com',
        channel: 'pos',
        delivery_type: 'pickup',
        status: 'delivered',
        pickup_pin: '9011',
        payment_method: 'tarjeta',
        items_summary: '5x Discos de Corte 4.5" DeWalt',
        total_cop: 80000,
        created_at: new Date(Date.now() - 60 * 60000).toISOString(),
      },
    ];
  }
}

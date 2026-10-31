import { IOrderRepository, CreateOrderParams } from '@/domain/repositories/IOrderRepository';
import { Order, OrderStatus } from '@/domain/entities/Order';
import { OrderItem } from '@/domain/entities/OrderItem';
import { supabase, getServiceRoleClient } from '../db/supabaseClient';

export interface OrderWithItems extends Order {
  items: OrderItem[];
  pickupPin?: string;
  paymentMethod?: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  unit_price_cop: number | string;
  quantity: number;
  subtotal_cop: number | string;
  created_at: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string | null;
  status: OrderStatus;
  subtotal_cop: number | string;
  tax_cop?: number | string | null;
  shipping_cop?: number | string | null;
  total_cop: number | string;
  customer_notes?: string | null;
  pickup_pin?: string | null;
  payment_method?: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    productSku: row.product_sku,
    unitPriceCop: Number(row.unit_price_cop),
    quantity: row.quantity,
    subtotalCop: Number(row.subtotal_cop),
    createdAt: new Date(row.created_at),
  };
}

function mapRowToOrder(row: OrderRow, items: OrderItem[] = []): OrderWithItems {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    deliveryType: row.delivery_type,
    deliveryAddress: row.delivery_address,
    status: row.status as OrderStatus,
    subtotalCop: Number(row.subtotal_cop),
    taxCop: Number(row.tax_cop || 0),
    shippingCop: Number(row.shipping_cop || 0),
    totalCop: Number(row.total_cop),
    customerNotes: row.customer_notes,
    pickupPin: row.pickup_pin || (row.order_number ? row.order_number.slice(-4) : '0000'),
    paymentMethod: row.payment_method || 'efectivo',
    items,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseOrderRepository implements IOrderRepository {
  async findById(id: string): Promise<OrderWithItems | null> {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (error || !order) return null;
    const items = (order.order_items || []).map(mapRowToOrderItem);
    return mapRowToOrder(order, items);
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderWithItems | null> {
    const cleanNumber = orderNumber.trim().replace(/^#/, '');
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .ilike('order_number', cleanNumber)
      .single();

    if (error || !order) return null;
    const items = (order.order_items || []).map(mapRowToOrderItem);
    return mapRowToOrder(order, items);
  }

  async findByCustomerEmail(email: string): Promise<OrderWithItems[]> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .ilike('customer_email', email.trim())
      .order('created_at', { ascending: false });

    if (error || !orders) return [];
    return orders.map((o) => {
      const items = (o.order_items || []).map(mapRowToOrderItem);
      return mapRowToOrder(o, items);
    });
  }

  async searchOrders(query: string): Promise<OrderWithItems[]> {
    const cleaned = query.trim().replace(/^#/, '');
    if (!cleaned) return [];

    // Search by order_number or customer_phone
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .or(`order_number.ilike.%${cleaned}%,customer_phone.ilike.%${cleaned}%,customer_email.ilike.%${cleaned}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !orders) return [];
    return orders.map((o) => {
      const items = (o.order_items || []).map(mapRowToOrderItem);
      return mapRowToOrder(o, items);
    });
  }

  async create(params: CreateOrderParams): Promise<OrderWithItems> {
    const client = getServiceRoleClient();
    const orderNumber = `FM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const pickupPin = Math.floor(1000 + Math.random() * 9000).toString();

    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone,
        delivery_type: params.deliveryType,
        delivery_address: params.deliveryAddress || null,
        status: 'pending_payment',
        pickup_pin: pickupPin,
        subtotal_cop: params.subtotalCop,
        tax_cop: 0,
        shipping_cop: params.shippingCop,
        total_cop: params.totalCop,
        customer_notes: params.customerNotes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error(`Error al crear la orden en Supabase: ${orderError?.message}`);
    }

    if (params.items.length > 0) {
      const itemsToInsert = params.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_sku: item.productSku,
        unit_price_cop: item.unitPriceCop,
        quantity: item.quantity,
        subtotal_cop: item.subtotalCop,
      }));

      const { error: itemsError } = await client
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error insertando order_items:', itemsError);
      }
    }

    return this.findById(order.id) as Promise<OrderWithItems>;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const client = getServiceRoleClient();
    const { data, error } = await client
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Error actualizando estado de la orden: ${error?.message}`);
    }

    return mapRowToOrder(data);
  }
}

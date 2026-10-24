import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';

export interface CreateOrderParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string | null;
  customerNotes?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    unitPriceCop: number;
    quantity: number;
    subtotalCop: number;
  }>;
  subtotalCop: number;
  shippingCop: number;
  totalCop: number;
}

export interface IOrderRepository {
  create(params: CreateOrderParams): Promise<Order>;
  findById(id: string): Promise<(Order & { items: OrderItem[] }) | null>;
  findByOrderNumber(orderNumber: string): Promise<(Order & { items: OrderItem[] }) | null>;
  findByCustomerEmail(email: string): Promise<Order[]>;
  updateStatus(id: string, status: Order['status']): Promise<Order>;
}

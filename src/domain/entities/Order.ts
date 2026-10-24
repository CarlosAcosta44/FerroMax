import { OrderItem } from './OrderItem';

export type DeliveryType = 'pickup' | 'delivery';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'preparing'
  | 'ready_for_pickup'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  deliveryAddress?: string | null;
  status: OrderStatus;
  subtotalCop: number;
  taxCop: number;
  shippingCop: number;
  totalCop: number;
  customerNotes?: string | null;
  items?: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

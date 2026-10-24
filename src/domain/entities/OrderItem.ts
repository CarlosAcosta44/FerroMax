export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku: string;
  unitPriceCop: number;
  quantity: number;
  subtotalCop: number;
  createdAt: Date;
}

import { IOrderRepository, CreateOrderParams } from '@/domain/repositories/IOrderRepository';
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Order } from '@/domain/entities/Order';

export class CreateOrder {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository
  ) {}

  async execute(params: CreateOrderParams): Promise<Order> {
    // 1. Verify stock availability for each item
    for (const item of params.items) {
      const product = await this.productRepo.findById(item.productId);
      if (!product) {
        throw new Error(`El producto ${item.productName} no fue encontrado.`);
      }
      if (product.stockQuantity < item.quantity) {
        throw new Error(
          `Stock insuficiente para ${product.name}. Disponibles: ${product.stockQuantity}, solicitados: ${item.quantity}.`
        );
      }
    }

    // 2. Persist the order
    return this.orderRepo.create(params);
  }
}

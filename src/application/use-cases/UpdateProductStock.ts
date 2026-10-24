import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';

export class UpdateProductStock {
  constructor(private productRepo: IProductRepository) {}

  async execute(productId: string, newStock: number): Promise<Product> {
    if (newStock < 0) {
      throw new Error('El stock no puede ser un valor negativo.');
    }
    return this.productRepo.updateStock(productId, newStock);
  }
}

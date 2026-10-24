import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';

export class GetProductBySlug {
  constructor(private productRepo: IProductRepository) {}

  async execute(slug: string): Promise<Product | null> {
    return this.productRepo.findBySlug(slug);
  }
}

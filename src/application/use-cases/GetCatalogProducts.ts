import { IProductRepository, ProductFilterOptions } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';

export class GetCatalogProducts {
  constructor(private productRepo: IProductRepository) {}

  async execute(filters?: ProductFilterOptions): Promise<Product[]> {
    return this.productRepo.findAll(filters);
  }
}

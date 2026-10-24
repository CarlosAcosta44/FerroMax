import { Product } from '../entities/Product';

export interface ProductFilterOptions {
  categoryId?: string;
  searchQuery?: string;
  inStockOnly?: boolean;
  featuredOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface IProductRepository {
  findAll(filters?: ProductFilterOptions): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  updateStock(id: string, newStock: number): Promise<Product>;
  updatePrice(id: string, newPriceCop: number): Promise<Product>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
}

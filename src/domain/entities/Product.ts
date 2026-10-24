export type UnitOfMeasure = 'unidad' | 'galon' | 'metro' | 'kilo' | 'caja' | 'rollo' | 'litro';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  description: string | null;
  priceCop: number;
  costPriceCop?: number | null;
  stockQuantity: number;
  minStockAlert: number;
  unitMeasure: UnitOfMeasure;
  imageUrl: string | null;
  isActive: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function getProductStockStatus(product: Pick<Product, 'stockQuantity' | 'minStockAlert'>): StockStatus {
  if (product.stockQuantity <= 0) {
    return 'out_of_stock';
  }
  if (product.stockQuantity <= product.minStockAlert) {
    return 'low_stock';
  }
  return 'in_stock';
}

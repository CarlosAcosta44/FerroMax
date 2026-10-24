import { IProductRepository, ProductFilterOptions } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';
import { supabase } from '../db/supabaseClient';

interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  description: string | null;
  price_cop: number | string;
  cost_price_cop: number | string | null;
  stock_quantity: number;
  min_stock_alert: number;
  unit_measure: string;
  image_url: string | null;
  is_active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

function mapRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    brand: row.brand,
    description: row.description,
    priceCop: Number(row.price_cop),
    costPriceCop: row.cost_price_cop ? Number(row.cost_price_cop) : null,
    stockQuantity: row.stock_quantity,
    minStockAlert: row.min_stock_alert,
    unitMeasure: row.unit_measure as Product['unitMeasure'],
    imageUrl: row.image_url,
    isActive: row.is_active,
    featured: row.featured,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseProductRepository implements IProductRepository {
  async findAll(filters?: ProductFilterOptions): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.inStockOnly) {
      query = query.gt('stock_quantity', 0);
    }
    if (filters?.featuredOnly) {
      query = query.eq('featured', true);
    }
    if (filters?.minPrice !== undefined) {
      query = query.gte('price_cop', filters.minPrice);
    }
    if (filters?.maxPrice !== undefined) {
      query = query.lte('price_cop', filters.maxPrice);
    }
    if (filters?.searchQuery) {
      query = query.ilike('name', `%${filters.searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products from Supabase:', error);
      return [];
    }
    return (data as ProductRow[]).map(mapRowToProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapRowToProduct(data as ProductRow);
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return mapRowToProduct(data as ProductRow);
  }

  async updateStock(id: string, newStock: number): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Error actualizando stock: ${error?.message || 'Error desconocido'}`);
    }
    return mapRowToProduct(data as ProductRow);
  }

  async updatePrice(id: string, newPriceCop: number): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({ price_cop: newPriceCop, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Error actualizando precio: ${error?.message || 'Error desconocido'}`);
    }
    return mapRowToProduct(data as ProductRow);
  }

  async getLowStockProducts(threshold = 5): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .lte('stock_quantity', threshold)
      .order('stock_quantity', { ascending: true });

    if (error || !data) return [];
    return (data as ProductRow[]).map(mapRowToProduct);
  }
}

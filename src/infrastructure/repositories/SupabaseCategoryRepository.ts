import { ICategoryRepository } from '@/domain/repositories/ICategoryRepository';
import { Category } from '@/domain/entities/Category';
import { supabase } from '../db/supabaseClient';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string;
  display_order: number;
  created_at: string;
}

export class SupabaseCategoryRepository implements ICategoryRepository {
  async findAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data) return [];
    return (data as CategoryRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      iconName: row.icon_name,
      displayOrder: row.display_order,
      createdAt: new Date(row.created_at),
    }));
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    const row = data as CategoryRow;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      iconName: row.icon_name,
      displayOrder: row.display_order,
      createdAt: new Date(row.created_at),
    };
  }
}

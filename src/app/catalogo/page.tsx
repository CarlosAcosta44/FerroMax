import React from 'react';
import { Search, SlidersHorizontal, ArrowLeft } from '@/presentation/components/common/Icons';
import Link from 'next/link';
import { ProductCard } from '@/presentation/components/catalog/ProductCard';
import { SupabaseProductRepository } from '@/infrastructure/repositories/SupabaseProductRepository';
import { SupabaseCategoryRepository } from '@/infrastructure/repositories/SupabaseCategoryRepository';
import { Product } from '@/domain/entities/Product';
import { Category } from '@/domain/entities/Category';

export const revalidate = 60;

interface CatalogoPageProps {
  searchParams: Promise<{
    categoria?: string;
    buscar?: string;
    en_stock?: string;
  }>;
}

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const params = await searchParams;
  const productRepo = new SupabaseProductRepository();
  const categoryRepo = new SupabaseCategoryRepository();

  let categories: Category[] = [];
  let products: Product[] = [];
  let selectedCategory: Category | null = null;

  try {
    categories = await categoryRepo.findAll();

    if (params.categoria) {
      selectedCategory = categories.find((c) => c.slug === params.categoria) || null;
    }

    products = await productRepo.findAll({
      categoryId: selectedCategory?.id,
      searchQuery: params.buscar,
      inStockOnly: params.en_stock === 'true',
    });
  } catch (err) {
    console.error('Error fetching catalog from Supabase:', err);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb & Title */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 mb-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver al Inicio
        </Link>
        <h1 className="text-3xl font-extrabold text-white">
          {selectedCategory ? selectedCategory.name : 'Catálogo de Productos'}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {selectedCategory?.description ||
            'Herramientas y materiales con existencias actualizadas en tiempo real en nuestra tienda.'}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        {/* Search Input */}
        <form method="GET" action="/catalogo" className="relative flex-1">
          {params.categoria && <input type="hidden" name="categoria" value={params.categoria} />}
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            name="buscar"
            defaultValue={params.buscar || ''}
            placeholder="Buscar por nombre o marca (ej. DeWalt, Stanley, Broca, Tubo)..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
        </form>

        {/* Quick Filter: In Stock Only */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtro:</span>
          </div>
          <Link
            href={
              params.en_stock === 'true'
                ? `/catalogo${params.categoria ? `?categoria=${params.categoria}` : ''}`
                : `/catalogo?en_stock=true${params.categoria ? `&categoria=${params.categoria}` : ''}`
            }
            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
              params.en_stock === 'true'
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-amber-500/40'
            }`}
          >
            {params.en_stock === 'true' ? '✓ Solo en stock' : 'Solo en stock'}
          </Link>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Link
            href="/catalogo"
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              !params.categoria
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Todos
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/catalogo?categoria=${c.slug}${params.en_stock ? '&en_stock=true' : ''}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                params.categoria === c.slug
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-400">
          <p className="text-base font-semibold text-zinc-200">
            No se encontraron productos disponibles
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Intenta cambiar los términos de búsqueda o revisa que las tablas de la base de datos de
            Supabase estén pobladas.
          </p>
          <Link
            href="/catalogo"
            className="mt-4 inline-block text-xs font-semibold text-amber-500 hover:text-amber-400"
          >
            Limpiar filtros
          </Link>
        </div>
      )}
    </div>
  );
}

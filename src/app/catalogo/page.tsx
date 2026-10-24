import React from 'react';
import { Search, SlidersHorizontal, ArrowLeft, Clock, ShieldCheck } from '@/presentation/components/common/Icons';
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
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      {/* Cabecera de Página & Breadcrumbs (Inspirado en diseño oficial) */}
      <section className="w-full bg-slate-100/70 border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-3">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-[#F97316] transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              <span>Inicio</span>
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/catalogo" className="hover:text-[#F97316] transition-colors">
              Catálogo Completo
            </Link>
            {selectedCategory && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-semibold">{selectedCategory.name}</span>
              </>
            )}
          </nav>

          {/* Título y Estado en Vivo */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {selectedCategory ? selectedCategory.name : 'Catálogo e Inventario en Tiempo Real'}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-emerald-200 text-xs font-semibold text-[#15803D] shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                  Stock Sincronizado en Vivo
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {selectedCategory?.description ||
                  'Consulta disponibilidad inmediata para retiro en mesón o despacho local. Precios con IVA incluido garantizados.'}
              </p>
            </div>

            {/* Indicadores Rápidos */}
            <div className="flex items-center gap-3 flex-wrap shrink-0 text-xs">
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-xs">
                <Clock className="h-4 w-4 text-[#F97316]" />
                <span className="text-slate-700 font-medium">Retiro gratis en 30-60 min</span>
              </div>
              <div className="flex items-center gap-2 bg-[#DCFCE7] text-[#15803D] px-3.5 py-2 rounded-lg font-semibold border border-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                <span>Stock físico verificado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Barra de Búsqueda y Filtro de Disponibilidad */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <form method="GET" action="/catalogo" className="relative flex-1">
            {params.categoria && <input type="hidden" name="categoria" value={params.categoria} />}
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="buscar"
              defaultValue={params.buscar || ''}
              placeholder="Buscar por nombre, marca o SKU (ej. DeWalt, Stanley, Broca, Tubo)..."
              className="w-full rounded bg-slate-50 border border-slate-200 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#F97316] focus:outline-none"
            />
          </form>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtro rápido:</span>
            </div>
            <Link
              href={
                params.en_stock === 'true'
                  ? `/catalogo${params.categoria ? `?categoria=${params.categoria}` : ''}`
                  : `/catalogo?en_stock=true${params.categoria ? `&categoria=${params.categoria}` : ''}`
              }
              className={`rounded border px-3 py-1.5 text-xs font-semibold transition ${
                params.en_stock === 'true'
                  ? 'border-emerald-500 bg-[#DCFCE7] text-[#15803D]'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-[#F97316]'
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
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                !params.categoria
                  ? 'bg-[#F97316] text-white shadow-sm'
                  : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
              }`}
            >
              Todos los productos
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/catalogo?categoria=${c.slug}${params.en_stock ? '&en_stock=true' : ''}`}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  params.categoria === c.slug
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            <p className="text-base font-semibold text-slate-800">
              No se encontraron herramientas o materiales con esos filtros
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Prueba modificando los términos de búsqueda o limpiando los filtros seleccionados.
            </p>
            <Link
              href="/catalogo"
              className="mt-4 inline-block text-xs font-bold text-[#F97316] hover:underline"
            >
              Restablecer catálogo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { Search, SlidersHorizontal, ArrowLeft } from '@/presentation/components/common/Icons';
import Link from 'next/link';
import { ProductCard } from '@/presentation/components/catalog/ProductCard';
import { Product } from '@/domain/entities/Product';

// Sample catalog dataset for initial compilation and demo
const ALL_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    categoryId: 'c-1',
    name: 'Taladro Percutor 1/2" 650W DeWalt',
    slug: 'taladro-percutor-dewalt-650w',
    sku: 'DW-DWD024',
    brand: 'DeWalt',
    description: 'Velocidad variable reversible, mandril metálico de 1/2 pulgada y mango ergonómico.',
    priceCop: 289000,
    stockQuantity: 8,
    minStockAlert: 3,
    unitMeasure: 'unidad',
    imageUrl: null,
    isActive: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'p-2',
    categoryId: 'c-1',
    name: 'Pulidora Angular 4-1/2" 850W Bosch',
    slug: 'pulidora-angular-bosch-850w',
    sku: 'BS-GWS850',
    brand: 'Bosch',
    description: 'Guarda con seguro antitorsión y bloqueo de husillo para cambio rápido de disco.',
    priceCop: 245000,
    stockQuantity: 4,
    minStockAlert: 3,
    unitMeasure: 'unidad',
    imageUrl: null,
    isActive: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'p-3',
    categoryId: 'c-2',
    name: 'Juego de Destornilladores 6 Piezas Stanley',
    slug: 'juego-destornilladores-stanley-6pz',
    sku: 'ST-62002',
    brand: 'Stanley',
    description: 'Barras de acero tratado con puntas magnéticas para mejor ajuste en tornillería.',
    priceCop: 42000,
    stockQuantity: 15,
    minStockAlert: 5,
    unitMeasure: 'unidad',
    imageUrl: null,
    isActive: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'p-4',
    categoryId: 'c-5',
    name: 'Pintura Vinilo Tipo 1 Blanco Galón Pintuco',
    slug: 'pintura-vinilo-tipo-1-blanco-galon',
    sku: 'PT-VIN1B',
    brand: 'Pintuco',
    description: 'Alto poder de cubrimiento, bajo olor y lavable para paredes de interior.',
    priceCop: 68000,
    stockQuantity: 2,
    minStockAlert: 4,
    unitMeasure: 'galon',
    imageUrl: null,
    isActive: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'p-5',
    categoryId: 'c-6',
    name: 'Caja Tornillo Drywall 6x1" (1000 Unidades)',
    slug: 'caja-tornillo-drywall-6x1-1000u',
    sku: 'TR-DW61',
    brand: 'Mamut',
    description: 'Punta aguda fosfatada negra para placas de yeso y estructuras de madera.',
    priceCop: 32000,
    stockQuantity: 20,
    minStockAlert: 6,
    unitMeasure: 'caja',
    imageUrl: null,
    isActive: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'p-6',
    categoryId: 'c-4',
    name: 'Rollo Cable Eléctrico #12 AWG 100 Metros',
    slug: 'rollo-cable-electrico-12-awg-100m',
    sku: 'CB-12100',
    brand: 'Centelsa',
    description: 'Cobre 100% puro certificado con aislamiento termoplástico THHN.',
    priceCop: 215000,
    stockQuantity: 0,
    minStockAlert: 2,
    unitMeasure: 'rollo',
    imageUrl: null,
    isActive: true,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function CatalogoPage() {
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
        <h1 className="text-3xl font-extrabold text-white">Catálogo de Productos</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Herramientas y materiales con existencias actualizadas en tiempo real en nuestra tienda.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, marca o SKU (ej. DeWalt, Stanley, 1/2)..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtros rápidos:</span>
          </div>
          <button className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 hover:border-amber-500/40">
            Solo en stock
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

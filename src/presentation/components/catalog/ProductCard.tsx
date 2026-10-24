'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, MessageCircle, AlertCircle, CheckCircle2, XCircle } from '@/presentation/components/common/Icons';
import { Product, getProductStockStatus } from '@/domain/entities/Product';
import { useCart } from '@/presentation/context/CartContext';
import { WhatsAppService } from '@/infrastructure/services/WhatsAppService';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const stockStatus = getProductStockStatus(product);

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(product.priceCop);

  const whatsAppLink = WhatsAppService.buildProductInquiryLink(product.name, product.sku);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition duration-200 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-black/40">
      {/* Top Header: Brand & Availability Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-zinc-400 uppercase tracking-wider text-[11px]">
            {product.brand}
          </span>

          {/* Real-time Stock Badge */}
          {stockStatus === 'in_stock' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />
              {product.stockQuantity} disponibles
            </span>
          )}

          {stockStatus === 'low_stock' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/30">
              <AlertCircle className="h-3 w-3" />
              ¡Últimas {product.stockQuantity} uds!
            </span>
          )}

          {stockStatus === 'out_of_stock' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400 border border-red-500/20">
              <XCircle className="h-3 w-3" />
              Agotado en tienda
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="mt-2 text-base font-semibold text-zinc-100 transition group-hover:text-amber-400 line-clamp-2">
          <Link href={`/catalogo/${product.slug}`}>{product.name}</Link>
        </h3>

        {/* SKU and Unit of Measure */}
        <p className="mt-1 text-xs text-zinc-500">
          Ref: <span className="text-zinc-400">{product.sku}</span> | Venta por:{' '}
          <span className="capitalize text-zinc-400">{product.unitMeasure}</span>
        </p>

        {/* Short Description */}
        {product.description && (
          <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
      </div>

      {/* Bottom Area: Price & Action Buttons */}
      <div className="mt-4 border-t border-zinc-800/80 pt-3">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs text-zinc-400 font-medium">Precio al detal:</span>
          <span className="text-lg font-bold text-white tracking-tight">
            {formattedPrice}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {/* Add to Cart Button */}
          <button
            onClick={() => addToCart(product)}
            disabled={stockStatus === 'out_of_stock'}
            className="col-span-4 flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 shadow-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {stockStatus === 'out_of_stock' ? 'Sin Stock' : 'Agregar a orden'}
          </button>

          {/* WhatsApp Direct Consult Button */}
          <a
            href={whatsAppLink}
            target="_blank"
            rel="noreferrer"
            aria-label="Consultar por WhatsApp"
            className="col-span-1 flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 text-emerald-400 transition hover:border-emerald-500/50 hover:bg-zinc-800 hover:text-emerald-300"
            title="Consultar al ferretero por WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

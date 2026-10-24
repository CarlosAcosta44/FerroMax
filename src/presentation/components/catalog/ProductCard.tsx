'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, MessageCircle } from '@/presentation/components/common/Icons';
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
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-md">
      {/* Top Section: Brand, SKU and Real-time Stock Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] truncate">
              {product.brand}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-[11px] text-slate-400 truncate">
              {product.sku}
            </span>
          </div>

          {/* Stock Badges matching DESIGN.md */}
          {stockStatus === 'in_stock' && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-medium text-[#15803D]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]"></span>
              {product.stockQuantity} en stock
            </span>
          )}

          {stockStatus === 'low_stock' && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-medium text-[#B45309]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]"></span>
              Últimas {product.stockQuantity} uds
            </span>
          )}

          {stockStatus === 'out_of_stock' && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-medium text-[#B91C1C]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]"></span>
              Agotado en tienda
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="mt-2.5 text-sm font-semibold text-slate-900 transition group-hover:text-[#F97316] line-clamp-2 leading-snug">
          <Link href={`/catalogo/${product.slug}`}>{product.name}</Link>
        </h3>

        {/* Unit Measure */}
        <p className="mt-1 text-xs text-slate-500">
          Venta por:{' '}
          <span className="capitalize font-medium text-slate-700">{product.unitMeasure}</span>
        </p>

        {/* Short Technical Description */}
        {product.description && (
          <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
      </div>

      {/* Bottom Area: Pricing & Actions */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs text-slate-500 font-medium">Precio por {product.unitMeasure}:</span>
          <span className="text-base font-bold text-slate-900 tabular-nums">
            {formattedPrice}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {/* Primary Action Button (Industrial Orange) */}
          <button
            onClick={() => addToCart(product)}
            disabled={stockStatus === 'out_of_stock'}
            className="col-span-4 flex items-center justify-center gap-1.5 rounded bg-[#F97316] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#EA580C] active:bg-[#C2410C] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 shadow-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {stockStatus === 'out_of_stock' ? 'Sin Stock' : 'Agregar a orden'}
          </button>

          {/* WhatsApp Direct Inquiry Button */}
          <a
            href={whatsAppLink}
            target="_blank"
            rel="noreferrer"
            aria-label="Consultar por WhatsApp"
            className="col-span-1 flex items-center justify-center rounded border border-[#25D366]/40 bg-[#DCFCE7]/60 text-[#15803D] transition hover:bg-[#25D366] hover:text-white"
            title="Consultar al ferretero por WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

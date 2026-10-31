'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Phone,
  CheckCircle,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Truck,
  Store,
  Share2,
  Wrench,
  Zap,
  Hammer,
  Droplet,
  Paintbrush,
  Package,
} from '@/presentation/components/common/Icons';
import { Product, getProductStockStatus } from '@/domain/entities/Product';
import { useCart } from '@/presentation/context/CartContext';
import { WhatsAppService } from '@/infrastructure/services/WhatsAppService';
import { ProductCard } from './ProductCard';

interface ProductDetailViewProps {
  product: Product;
  categoryName?: string;
  relatedProducts?: Product[];
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'herramientas-electricas': Zap,
  'herramientas-manuales': Hammer,
  'plomeria-griferia': Droplet,
  'electricidad-iluminacion': Zap,
  'pinturas-adhesivos': Paintbrush,
  'tornilleria-fijaciones': Package,
};

export function ProductDetailView({
  product,
  categoryName = 'Herramientas',
  relatedProducts = [],
}: ProductDetailViewProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const stockStatus = getProductStockStatus(product);

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(product.priceCop);

  const totalPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(product.priceCop * quantity);

  const whatsAppLink = WhatsAppService.buildProductInquiryLink(
    `${product.name} (SKU: ${product.sku}) - Quiero consultar disponibilidad y envío`,
    product.sku
  );

  const handleAddToCart = () => {
    if (stockStatus === 'out_of_stock') return;
    addToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      setIsCartOpen(true);
    }, 400);
  };

  const handleBuyNow = () => {
    if (stockStatus === 'out_of_stock') return;
    addToCart(product, quantity);
    setIsCartOpen(true);
  };

  const CategoryIcon = CATEGORY_ICONS[product.categoryId] || Wrench;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      {/* Breadcrumb Navigation */}
      <div className="bg-slate-100/80 border-b border-slate-200 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto">
            <Link href="/" className="hover:text-[#F97316] transition flex items-center gap-1 shrink-0">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Inicio</span>
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/catalogo" className="hover:text-[#F97316] transition shrink-0">
              Catálogo
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-medium shrink-0">{categoryName}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left: Product Visual Box */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="w-full aspect-square bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center p-8 relative overflow-hidden group">
                {/* Brand Tag */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
                  {product.brand}
                </div>

                {/* Live Stock Badge */}
                <div className="absolute top-4 right-4">
                  {stockStatus === 'in_stock' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      En Stock: {product.stockQuantity} {product.unitMeasure}s
                    </span>
                  )}
                  {stockStatus === 'low_stock' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Últimas {product.stockQuantity} unidades
                    </span>
                  )}
                  {stockStatus === 'out_of_stock' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-800 shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                      Agotado Temporalmente
                    </span>
                  )}
                </div>

                {/* Center Visual Icon representation */}
                <div className="w-40 h-40 rounded-3xl bg-white shadow-lg border border-slate-100 flex items-center justify-center text-[#EA580C] group-hover:scale-105 transition-transform duration-300">
                  <CategoryIcon className="w-20 h-20" />
                </div>

                {/* Bottom Bar: SKU & Quality Assurance */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-500 bg-white/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-200/60">
                  <span className="font-mono font-bold text-slate-700">SKU: {product.sku}</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <ShieldCheck className="h-4 w-4" /> 100% Original
                  </span>
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                  <Store className="h-5 w-5 text-[#EA580C] shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">Retiro en Mesón</span>
                    <span className="text-slate-500 text-[11px]">Listo en 30-60 min</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                  <Truck className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">Domicilio Local</span>
                    <span className="text-slate-500 text-[11px]">Despacho en el día</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Product Details & Purchase Controls */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs uppercase font-bold text-[#EA580C] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    {categoryName}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-500">
                    Venta por {product.unitMeasure}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {formattedPrice}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">COP</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    IVA (19%) Incluido
                  </span>
                </div>
              </div>

              {/* Delivery Options Comparison (User Highlight: Retiro en Mesón es más barato) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-orange-50/50 rounded-xl border border-orange-200/80">
                <div className="p-3 bg-white rounded-lg border border-orange-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Store className="h-4 w-4 text-[#EA580C]" />
                        Retiro en Tienda / Mesón
                      </span>
                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        ¡Gratis!
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Pasa a recoger tu pedido a nuestra tienda física. <strong>¡Ahorras el flete y te sale más barato!</strong>
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#EA580C] mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Listo en 30 a 60 minutos
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-slate-600" />
                        Envío a Domicilio Local
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 font-mono">
                        $8.000 COP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Te lo llevamos directo a tu obra, taller o casa en motocarro o flete local el mismo día.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Entrega hoy mismo
                  </span>
                </div>
              </div>

              {/* Quantity Selector & CTAs */}
              <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                    <label className="text-xs font-bold text-slate-700">Cantidad:</label>
                    <div className="flex items-center bg-white rounded-xl border border-slate-300 shadow-2xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1 || stockStatus === 'out_of_stock'}
                        className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 font-bold transition disabled:opacity-40"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={product.stockQuantity}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setQuantity(Math.max(1, Math.min(val, product.stockQuantity || 1)));
                        }}
                        className="w-12 text-center text-sm font-bold text-slate-900 border-x border-slate-200 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                        disabled={quantity >= product.stockQuantity || stockStatus === 'out_of_stock'}
                        className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 font-bold transition disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-slate-500">
                      (Máx. {product.stockQuantity} {product.unitMeasure}s)
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-500 font-medium">Subtotal:</span>
                    <span className="text-lg font-black text-[#EA580C] font-mono">
                      {totalPrice} COP
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={stockStatus === 'out_of_stock'}
                    className={`py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition active:scale-95 ${
                      addedAnimation
                        ? 'bg-emerald-600 text-white'
                        : stockStatus === 'out_of_stock'
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#F97316] hover:bg-[#EA580C] text-white shadow-orange-500/20'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>{addedAnimation ? '¡Agregado al Carrito!' : 'Agregar al Carrito'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={stockStatus === 'out_of_stock'}
                    className="py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-black text-white flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 text-[#F97316]" />
                    <span>Comprar Ahora</span>
                  </button>
                </div>

                {/* WhatsApp Direct Consult Button */}
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Phone className="h-4 w-4 text-[#25D366]" />
                  <span>¿Tienes dudas técnicas? Pregúntanos por WhatsApp</span>
                </a>
              </div>

              {/* Technical Description & Specs */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Descripción y Especificaciones Técnicas
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.description ||
                    'Producto certificado de alta durabilidad para trabajo pesado y hogar. Cumple con los estándares de calidad ferretera colombiana.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Marca:</span>
                    <span className="font-bold text-slate-800">{product.brand}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Código / SKU:</span>
                    <span className="font-mono font-bold text-slate-800">{product.sku}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Presentación:</span>
                    <span className="capitalize font-bold text-slate-800">{product.unitMeasure}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Categoría:</span>
                    <span className="font-bold text-slate-800">{categoryName}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Garantía:</span>
                    <span className="font-bold text-emerald-700">12 Meses Oficial</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Disponibilidad:</span>
                    <span className="font-bold text-slate-800">Inmediata en Mesón</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Productos Relacionados y Complementarios
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Artículos de la misma categoría que también te pueden interesar.
                </p>
              </div>
              <Link
                href={`/catalogo?categoria=${product.categoryId}`}
                className="text-xs font-bold text-[#EA580C] hover:underline"
              >
                Ver más en {categoryName} →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

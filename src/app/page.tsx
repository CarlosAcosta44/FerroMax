import React from 'react';
import Link from 'next/link';
import {
  Wrench,
  Zap,
  Hammer,
  Droplet,
  Paintbrush,
  Package,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Phone,
} from '@/presentation/components/common/Icons';
import { ProductCard } from '@/presentation/components/catalog/ProductCard';
import { Product } from '@/domain/entities/Product';

// Sample featured products for initial render & demo
const FEATURED_PRODUCTS: Product[] = [
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
];

const CATEGORIES = [
  { name: 'Herramientas Eléctricas', slug: 'herramientas-electricas', icon: Zap, count: '18 productos' },
  { name: 'Herramientas Manuales', slug: 'herramientas-manuales', icon: Hammer, count: '34 productos' },
  { name: 'Plomería y Tuberías', slug: 'plomeria-griferia', icon: Droplet, count: '26 productos' },
  { name: 'Electricidad y Cables', slug: 'electricidad-iluminacion', icon: Zap, count: '22 productos' },
  { name: 'Pinturas y Siliconas', slug: 'pinturas-adhesivos', icon: Paintbrush, count: '15 productos' },
  { name: 'Tornillos y Fijaciones', slug: 'tornilleria-fijaciones', icon: Package, count: '45 productos' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-transparent py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Inventario en Tiempo Real Sincronizado
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Tu ferretería de confianza,{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                ahora en tu pantalla.
              </span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
              Verifica existencias reales antes de salir de casa, paga fácil por PSE o tarjeta,
              y recoge en el mostrador sin filas o recibe en tu domicilio.
            </p>

            {/* Quick Search Bar */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/catalogo"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
              >
                <Search className="h-4 w-4" />
                Explorar Catálogo con Stock
              </Link>
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noreferrer"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-emerald-500/50 hover:text-emerald-400"
              >
                <Phone className="h-4 w-4 text-emerald-400" />
                Consultar por WhatsApp
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 grid grid-cols-1 gap-4 pt-8 border-t border-zinc-800/80 sm:grid-cols-3 text-xs text-zinc-400">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Stock físico verificado en tienda</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>Retiro en mostrador en 30 min</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span>Comprobante digital descargable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Departamentos y Materiales
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Encuentra lo que necesitas por categoría con inventario disponible.
            </p>
          </div>
          <Link
            href="/catalogo"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-400"
          >
            Ver todos los productos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={`/catalogo?categoria=${cat.slug}`}
                className="group flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center transition hover:border-amber-500/40 hover:bg-zinc-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800 text-amber-500 transition group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-zinc-950">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="mt-3 text-xs font-semibold text-zinc-200 group-hover:text-amber-400">
                  {cat.name}
                </span>
                <span className="mt-1 text-[11px] text-zinc-500">{cat.count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products with Real-time Stock Badges */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 uppercase tracking-wider">
              <Wrench className="h-3.5 w-3.5" />
              Disponibilidad Inmediata
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Herramientas y Materiales Más Buscados
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1"
          >
            Ir al catálogo completo <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* How It Works Flow */}
      <section className="border-y border-zinc-800 bg-zinc-900/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white">
              ¿Cómo funciona comprar en FerroMax?
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Ahorra tiempo y asegura tus herramientas en 4 sencillos pasos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
              <span className="text-2xl font-black text-amber-500">01</span>
              <h3 className="mt-2 text-base font-semibold text-white">Busca tu producto</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Encuentra taladros, tornillos, pinturas o tubos en nuestro catálogo organizado.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
              <span className="text-2xl font-black text-amber-500">02</span>
              <h3 className="mt-2 text-base font-semibold text-white">Verifica el stock</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Observa cuántas unidades exactas quedan en la tienda física en tiempo real.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
              <span className="text-2xl font-black text-amber-500">03</span>
              <h3 className="mt-2 text-base font-semibold text-white">Paga o reserva</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Realiza tu pago en línea de forma segura o contacta al asesor por WhatsApp.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
              <span className="text-2xl font-black text-amber-500">04</span>
              <h3 className="mt-2 text-base font-semibold text-white">Retira sin filas</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Pasa por el mostrador en 30 minutos o recibe tu pedido a domicilio en tu casa u obra.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Store Hours */}
      <section id="ubicacion" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5" />
                Punto de Venta Físico
              </div>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Visítanos en nuestra sede principal
              </h2>
              <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
                Estamos ubicados en el corazón del sector comercial para atenderte de forma
                personalizada con la atención experta del ferretero tradicional.
              </p>

              <div className="mt-6 space-y-3 text-sm text-zinc-300">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Calle Principal #45-12, Sector Comercial</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Lun - Sáb: 7:30 AM a 6:30 PM | Dom: 8:30 AM a 2:00 PM</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>WhatsApp directo: 300 123 4567</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center">
              <Wrench className="h-10 w-10 text-amber-500 mb-3" />
              <h3 className="text-lg font-bold text-white">¿Dudas sobre qué material elegir?</h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-xs">
                Escríbenos directamente y un asesor de mostrador te orientará en segundos.
              </p>
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-zinc-950 transition hover:bg-emerald-400"
              >
                <Phone className="h-3.5 w-3.5" />
                Chatear con el Ferretero
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

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
import { SupabaseProductRepository } from '@/infrastructure/repositories/SupabaseProductRepository';
import { SupabaseCategoryRepository } from '@/infrastructure/repositories/SupabaseCategoryRepository';
import { Product } from '@/domain/entities/Product';
import { Category } from '@/domain/entities/Category';

export const revalidate = 60;

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'herramientas-electricas': Zap,
  'herramientas-manuales': Hammer,
  'plomeria-griferia': Droplet,
  'electricidad-iluminacion': Zap,
  'pinturas-adhesivos': Paintbrush,
  'tornilleria-fijaciones': Package,
};

export default async function HomePage() {
  const productRepo = new SupabaseProductRepository();
  const categoryRepo = new SupabaseCategoryRepository();

  let featuredProducts: Product[] = [];
  let categories: Category[] = [];

  try {
    const [prods, cats] = await Promise.all([
      productRepo.findAll({ featuredOnly: true }),
      categoryRepo.findAll(),
    ]);
    featuredProducts = prods;
    categories = cats;
  } catch (err) {
    console.error('Error al consultar datos desde Supabase:', err);
  }

  return (
    <div className="flex flex-col gap-14 pb-16 bg-[#F8FAFC]">
      {/* 1. Hero Principal Cálido & Dinámico (Diseño inicio_ferromax) */}
      <section className="relative w-full bg-[#0F172A] text-white overflow-hidden shadow-lg border-b border-slate-800">
        {/* Ambient glowing accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#F97316]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-28 -left-20 w-80 h-80 bg-orange-600/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 flex flex-col lg:flex-row items-center gap-12">
          {/* Columna Texto y CTAs */}
          <div className="w-full lg:w-3/5 flex flex-col gap-5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F97316]/20 text-[#F97316] w-fit text-xs font-semibold border border-[#F97316]/30">
              <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse"></span>
              <span>Stock de mesón actualizado en tiempo real</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Todo para tus proyectos de hogar, reparación y construcción
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Herramientas, pinturas, plomería y fijaciones con stock garantizado en tiempo real.
              Retira gratis en tienda en menos de 1 hora o pide a domicilio para empezar hoy mismo.
            </p>

            {/* CTAs de Acción */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white px-5 py-3 rounded font-semibold text-xs sm:text-sm shadow-md transition-all hover:-translate-y-0.5"
              >
                <Wrench className="h-4 w-4" />
                <span>Ver Catálogo Completo</span>
              </Link>
              <Link
                href="#ofertas"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded font-semibold text-xs sm:text-sm border border-slate-700 transition-colors"
              >
                <span>Ver Ofertas de la Semana</span>
                <ArrowRight className="h-4 w-4 text-[#F97316]" />
              </Link>
            </div>

            {/* Mini Buscador Rápido de Barrio */}
            <form
              method="GET"
              action="/catalogo"
              className="w-full max-w-xl mt-3 bg-white rounded-lg p-1.5 shadow-lg flex items-center gap-2 text-slate-800"
            >
              <Search className="h-5 w-5 text-slate-400 ml-2.5 shrink-0" />
              <input
                type="text"
                name="buscar"
                placeholder="¿Qué necesitas reparar hoy? Ej. llave de paso, brocha, tarugos..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none py-1.5"
              />
              <button
                type="submit"
                className="bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold px-4 py-2 rounded transition-colors shrink-0"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Tarjeta Visual de Asesoría en Mesón */}
          <div className="w-full lg:w-2/5 flex flex-col items-center">
            <div className="w-full rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#F97316]/20 border border-[#F97316]/40 flex items-center justify-center text-[#F97316]">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Asesoría FerroMax en Mesón</h3>
                  <p className="text-xs text-slate-400">Te ayudamos a elegir la pieza exacta para tu arreglo</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 text-[#25D366] shrink-0" />
                  <span>Atención directa de Don Carlos y asesores técnicos</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-[#F97316] shrink-0" />
                  <span>Tu pedido empacado y listo en 30 minutos</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>Garantía oficial y comprobante digital con QR</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">¿Dudas sobre medidas o roscas?</span>
                <a
                  href="https://wa.me/573001234567"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#25D366] hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  Escribir a WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Badges de Confianza Vecinales */}
        <div className="w-full bg-slate-950/60 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[#F97316]/15 flex items-center justify-center text-[#F97316] shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white leading-tight">Retiro en 30 min</p>
                <p className="text-[11px] text-slate-400">Listo en mesón express</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[#F97316]/15 flex items-center justify-center text-[#F97316] shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white leading-tight">Despacho Rápido</p>
                <p className="text-[11px] text-slate-400">A tu casa, taller u obra</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[#F97316]/15 flex items-center justify-center text-[#F97316] shrink-0">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white leading-tight">Atención Experta</p>
                <p className="text-[11px] text-slate-400">Consejos claros y directos</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[#F97316]/15 flex items-center justify-center text-[#F97316] shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white leading-tight">Todos los Medios</p>
                <p className="text-[11px] text-slate-400">PSE, Tarjeta y Efectivo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categorías Populares (Explora por Departamento) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[#F97316] font-semibold text-xs tracking-wider uppercase mb-1">
              <span>EXPLORA POR DEPARTAMENTO</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Encuentra lo que necesitas para tu proyecto
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="text-[#F97316] hover:text-[#EA580C] font-semibold text-xs inline-flex items-center gap-1"
          >
            <span>Ver todos los pasillos</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || Wrench;
              return (
                <Link
                  key={cat.id}
                  href={`/catalogo?categoria=${cat.slug}`}
                  className="group bg-white rounded-lg p-4 shadow-sm hover:shadow-md border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-[#F97316] shrink-0 group-hover:bg-[#F97316] group-hover:text-white transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#F97316] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {cat.description || 'Disponibilidad de stock en tienda física.'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 bg-white">
            Cargando departamentos desde la base de datos de Supabase...
          </div>
        )}
      </section>

      {/* 3. Productos Destacados con Stock en Vivo */}
      <section id="ofertas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-1">
              <Wrench className="h-3.5 w-3.5" />
              <span>DISPONIBILIDAD INMEDIATA</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Herramientas y Materiales con Stock en Tienda
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="text-xs font-semibold text-[#F97316] hover:text-[#EA580C] flex items-center gap-1"
          >
            <span>Ir al catálogo completo</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500 bg-white">
            <p className="font-semibold text-slate-700">Conectando con la base de datos de Supabase...</p>
            <p className="mt-1 text-slate-400">
              Ejecuta el script SQL en Supabase para visualizar el inventario en vivo.
            </p>
          </div>
        )}
      </section>

      {/* 4. ¿Cómo Funciona la Compra Vecinal? */}
      <section className="border-y border-slate-200 bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
              Ágil, Fácil y sin Filas
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              ¿Cómo funciona comprar en FerroMax?
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Asegura tus piezas desde el celular y retira en el mesón en minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5">
              <span className="text-xl font-black text-[#F97316]">01</span>
              <h3 className="mt-2 text-sm font-bold text-slate-900">Busca tu producto</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Encuentra taladros, tornillos, pinturas o tubos en nuestro catálogo organizado.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5">
              <span className="text-xl font-black text-[#F97316]">02</span>
              <h3 className="mt-2 text-sm font-bold text-slate-900">Verifica el stock</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Observa cuántas unidades exactas quedan en la tienda física en tiempo real.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5">
              <span className="text-xl font-black text-[#F97316]">03</span>
              <h3 className="mt-2 text-sm font-bold text-slate-900">Paga o reserva</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Realiza tu pago en línea de forma segura o contacta al asesor por WhatsApp.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-5">
              <span className="text-xl font-black text-[#F97316]">04</span>
              <h3 className="mt-2 text-sm font-bold text-slate-900">Retira sin filas</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Pasa por el mostrador en 30 minutos o recibe tu pedido a domicilio en tu casa u obra.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Punto de Venta Físico y Contacto */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F97316] uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5" />
                Punto de Venta Físico
              </div>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Visítanos en nuestra sede principal
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Estamos ubicados en el sector comercial para atenderte de forma
                personalizada con la atención experta del ferretero tradicional.
              </p>

              <div className="mt-5 space-y-2.5 text-xs text-slate-700">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#F97316] shrink-0" />
                  <span>Calle Principal #45-12, Sector Comercial</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#F97316] shrink-0" />
                  <span>Lun - Sáb: 7:30 AM a 6:30 PM | Dom: 8:30 AM a 2:00 PM</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#25D366] shrink-0" />
                  <span>WhatsApp directo: 300 123 4567</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-[#F8FAFC] p-6 text-center">
              <Wrench className="h-10 w-10 text-[#F97316] mb-3" />
              <h3 className="text-base font-bold text-slate-900">¿Dudas sobre qué material elegir?</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Escríbenos directamente y un asesor de mostrador te orientará en segundos.
              </p>
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded bg-[#25D366] hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
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

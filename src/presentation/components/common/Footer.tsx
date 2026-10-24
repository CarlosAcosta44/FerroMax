import React from 'react';
import Link from 'next/link';
import { Wrench, MapPin, Phone, Clock, MessageSquare, ShieldCheck } from '@/presentation/components/common/Icons';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#0F172A] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand & Purpose */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F97316] text-white shadow-md shadow-orange-500/20">
                <Wrench className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-xl font-black tracking-tight text-white leading-none">
                FERRO<span className="text-[#F97316]">MAX</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              La ferretería tradicional de tu zona, ahora con inventario en tiempo real.
              Verifica existencias antes de salir, paga seguro y retira en mesón en minutos.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#F97316] font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Garantía oficial y stock verificado en tienda</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Departamentos
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/catalogo?categoria=herramientas-electricas" className="transition hover:text-[#F97316]">
                  Herramientas Eléctricas
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=herramientas-manuales" className="transition hover:text-[#F97316]">
                  Herramientas Manuales
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=plomeria-griferia" className="transition hover:text-[#F97316]">
                  Plomería y Accesorios
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=electricidad-iluminacion" className="transition hover:text-[#F97316]">
                  Electricidad y Cables
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=pinturas-adhesivos" className="transition hover:text-[#F97316]">
                  Pinturas y Siliconas
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=tornilleria-fijaciones" className="transition hover:text-[#F97316]">
                  Tornillos y Fijaciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & History */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Atención al Cliente
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/historial" className="transition hover:text-[#F97316]">
                  Consultar historial y comprobantes
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/573001234567"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[#25D366] hover:underline"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Escribir a WhatsApp
                </a>
              </li>
              <li>
                <Link href="/admin" className="text-slate-500 transition hover:text-slate-300">
                  Acceso Administrador (Don Carlos)
                </Link>
              </li>
            </ul>
          </div>

          {/* Store Location */}
          <div className="space-y-2.5 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Punto de Venta Físico
            </h4>
            <p className="flex items-start gap-2 text-slate-300">
              <MapPin className="h-4 w-4 shrink-0 text-[#F97316] mt-0.5" />
              <span>Calle Principal #45-12, Sector Comercial</span>
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <Phone className="h-4 w-4 shrink-0 text-[#F97316]" />
              <span>Tel: (601) 555-4321 / 300 123 4567</span>
            </p>
            <p className="flex items-start gap-2 text-slate-300">
              <Clock className="h-4 w-4 shrink-0 text-[#F97316] mt-0.5" />
              <span>Lun a Sáb: 7:30 AM - 6:30 PM | Dom: 8:30 AM - 2:00 PM</span>
            </p>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-8 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} FerroMax. Todos los derechos reservados.</p>
          <p className="text-[11px]">
            Desarrollado como caso de demostración por{' '}
            <span className="font-semibold text-[#F97316]">Telar Web</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

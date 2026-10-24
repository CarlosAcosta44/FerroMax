import React from 'react';
import Link from 'next/link';
import { Wrench, MapPin, Phone, Clock, MessageSquare, ShieldCheck } from '@/presentation/components/common/Icons';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand & Purpose */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Wrench className="h-4 w-4 text-zinc-950 stroke-[2.5]" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                FERRO<span className="text-amber-500">MAX</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              La ferretería tradicional de tu zona, ahora con inventario en tiempo real.
              Verifica existencias antes de salir, paga seguro y retira en minutos.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-500 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Garantía oficial y stock real</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
              Departamentos
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/catalogo?categoria=herramientas-electricas" className="transition hover:text-amber-400">
                  Herramientas Eléctricas
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=herramientas-manuales" className="transition hover:text-amber-400">
                  Herramientas Manuales
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=plomeria-griferia" className="transition hover:text-amber-400">
                  Plomería y Accesorios
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=electricidad-iluminacion" className="transition hover:text-amber-400">
                  Electricidad y Cables
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=pinturas-adhesivos" className="transition hover:text-amber-400">
                  Pinturas y Siliconas
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=tornilleria-fijaciones" className="transition hover:text-amber-400">
                  Tornillos y Fijaciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & History */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
              Atención al Cliente
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/historial" className="transition hover:text-amber-400">
                  Consultar historial y comprobantes
                </Link>
              </li>
              <li>
                <Link href="/#ubicacion" className="transition hover:text-amber-400">
                  Horarios y Ubicación en Mapa
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/573001234567"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Escribir a WhatsApp
                </a>
              </li>
              <li>
                <Link href="/admin" className="text-zinc-600 transition hover:text-zinc-400">
                  Acceso Administrador (Ferretero)
                </Link>
              </li>
            </ul>
          </div>

          {/* Store Location */}
          <div className="space-y-2.5 text-xs">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
              Punto de Venta Físico
            </h4>
            <p className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <span>Calle Principal #45-12, Sector Comercial</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Tel: (601) 555-4321 / 300 123 4567</span>
            </p>
            <p className="flex items-start gap-2">
              <Clock className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <span>Lun a Sáb: 7:30 AM - 6:30 PM | Dom: 8:30 AM - 2:00 PM</span>
            </p>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-8 border-t border-zinc-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <p>© {new Date().getFullYear()} FerroMax. Todos los derechos reservados.</p>
          <p className="text-[11px]">
            Desarrollado como caso de demostración por{' '}
            <span className="font-semibold text-amber-500">Telar Web</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

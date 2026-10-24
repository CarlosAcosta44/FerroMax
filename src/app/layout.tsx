import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/presentation/components/common/Header';
import { Footer } from '@/presentation/components/common/Footer';
import { CartProvider } from '@/presentation/context/CartContext';

export const metadata: Metadata = {
  title: 'FerroMax – Ferretería, Herramientas y Materiales | Stock en Vivo',
  description:
    'Ferretería tradicional con catálogo digital e inventario en tiempo real. Herramientas eléctricas, plomería, tornillería y pinturas con retiro en mostrador o entrega local rápida.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col bg-[#0f1012] text-zinc-100 antialiased selection:bg-amber-500/20 selection:text-amber-300">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}

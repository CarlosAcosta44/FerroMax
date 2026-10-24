import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/presentation/components/common/Header';
import { Footer } from '@/presentation/components/common/Footer';
import { CartProvider } from '@/presentation/context/CartContext';
import { AuthProvider } from '@/presentation/context/AuthContext';

export const metadata: Metadata = {
  title: 'FerroMax – Ferretería y Herramientas | Tu Ferretería de Barrio',
  description:
    'Ferretería tradicional con catálogo digital e inventario en tiempo real. Herramientas eléctricas, plomería, tornillería y pinturas con retiro en mostrador en 30-60 minutos o despacho local.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900 antialiased selection:bg-orange-100 selection:text-orange-900">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

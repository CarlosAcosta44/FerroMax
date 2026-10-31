import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SupabaseProductRepository } from '@/infrastructure/repositories/SupabaseProductRepository';
import { SupabaseCategoryRepository } from '@/infrastructure/repositories/SupabaseCategoryRepository';
import { ProductDetailView } from '@/presentation/components/catalog/ProductDetailView';

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const productRepo = new SupabaseProductRepository();
  const product = await productRepo.findBySlug(slug);

  if (!product) {
    return {
      title: 'Producto no encontrado | FerroMax',
      description: 'El producto solicitado no está disponible en el catálogo de FerroMax.',
    };
  }

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(product.priceCop);

  return {
    title: `${product.name} - ${formattedPrice} | FerroMax Ferretería`,
    description: `${product.name} marca ${product.brand}. ${product.description || 'Disponible para retiro gratis en mesón o envío a domicilio.'}`,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const productRepo = new SupabaseProductRepository();
  const categoryRepo = new SupabaseCategoryRepository();

  const product = await productRepo.findBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch category & related products
  let categoryName = 'Herramientas y Ferretería';
  let relatedProducts: typeof product[] = [];

  try {
    const [categories, related] = await Promise.all([
      categoryRepo.findAll(),
      productRepo.findAll({ categoryId: product.categoryId }),
    ]);

    const cat = categories.find((c) => c.id === product.categoryId);
    if (cat) categoryName = cat.name;

    relatedProducts = related.filter((p) => p.id !== product.id);
  } catch (err) {
    console.error('Error fetching product context:', err);
  }

  return (
    <ProductDetailView
      product={product}
      categoryName={categoryName}
      relatedProducts={relatedProducts}
    />
  );
}

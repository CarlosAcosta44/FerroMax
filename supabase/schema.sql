-- ========================================================
-- FERROMAX - Database Schema for Supabase / PostgreSQL
-- ========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT DEFAULT 'wrench',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL DEFAULT 'Genérico',
    description TEXT,
    price_cop NUMERIC(12, 2) NOT NULL CHECK (price_cop >= 0),
    cost_price_cop NUMERIC(12, 2) CHECK (cost_price_cop >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_alert INT NOT NULL DEFAULT 5 CHECK (min_stock_alert >= 0),
    unit_measure TEXT NOT NULL DEFAULT 'unidad' CHECK (unit_measure IN ('unidad', 'galon', 'metro', 'kilo', 'caja', 'rollo', 'litro')),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table: customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    document_type TEXT DEFAULT 'CC' CHECK (document_type IN ('CC', 'NIT', 'CE', 'PP')),
    document_number TEXT,
    address TEXT,
    city TEXT DEFAULT 'Bogotá',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table: orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_type TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'delivery')),
    delivery_address TEXT,
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
        status IN ('pending_payment', 'paid', 'preparing', 'ready_for_pickup', 'delivered', 'cancelled')
    ),
    subtotal_cop NUMERIC(12, 2) NOT NULL CHECK (subtotal_cop >= 0),
    tax_cop NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tax_cop >= 0),
    shipping_cop NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_cop >= 0),
    total_cop NUMERIC(12, 2) NOT NULL CHECK (total_cop >= 0),
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table: order_items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    unit_price_cop NUMERIC(12, 2) NOT NULL CHECK (unit_price_cop >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal_cop NUMERIC(12, 2) NOT NULL CHECK (subtotal_cop >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Table: payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    transaction_ref TEXT NOT NULL UNIQUE,
    payment_method TEXT NOT NULL CHECK (
        payment_method IN ('pse', 'credit_card', 'debit_card', 'cash_on_delivery', 'bank_transfer')
    ),
    amount_cop NUMERIC(12, 2) NOT NULL CHECK (amount_cop >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'rejected', 'refunded')
    ),
    receipt_number TEXT NOT NULL UNIQUE,
    gateway_payload JSONB DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for performance and search
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON public.products(is_active, stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);

CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON public.payments(receipt_number);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING gin(
    to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(description, '') || ' ' || coalesce(sku, ''))
);

-- Trigger: Atomic inventory decrement on approved payment
CREATE OR REPLACE FUNCTION public.decrement_inventory_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
        UPDATE public.orders
        SET status = 'paid', updated_at = now()
        WHERE id = NEW.order_id;

        UPDATE public.products p
        SET stock_quantity = p.stock_quantity - oi.quantity,
            updated_at = now()
        FROM public.order_items oi
        WHERE oi.order_id = NEW.order_id
          AND oi.product_id = p.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_decrement_inventory ON public.payments;
CREATE TRIGGER trg_decrement_inventory
AFTER INSERT OR UPDATE OF status ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.decrement_inventory_on_payment();

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies: categories
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth all categories" ON public.categories FOR ALL TO authenticated USING (true);

-- Policies: products
CREATE POLICY "Allow public read active products" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Allow auth all products" ON public.products FOR ALL TO authenticated USING (true);

-- Policies: customers
CREATE POLICY "Allow public insert customers" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow auth read customers" ON public.customers FOR SELECT TO authenticated USING (true);

-- Policies: orders
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public read orders by email or phone" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth all orders" ON public.orders FOR ALL TO authenticated USING (true);

-- Policies: order_items
CREATE POLICY "Allow public insert order_items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public read order_items" ON public.order_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth all order_items" ON public.order_items FOR ALL TO authenticated USING (true);

-- Policies: payments
CREATE POLICY "Allow public insert payments" ON public.payments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public read payments" ON public.payments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth all payments" ON public.payments FOR ALL TO authenticated USING (true);

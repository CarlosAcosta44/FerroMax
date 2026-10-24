-- ==============================================================================
-- FerroMax: Admin Data Schema & Real Data Enhancements
-- Adds support for:
-- 1. Products: aisle location, cost_cop, min_stock threshold
-- 2. Customers: trade/profession, club discount tier, credit balance (fiado)
-- 3. Orders: channel ('web' vs 'pos'), pickup_pin for Click & Collect, payment_method
-- 4. Cash Shifts (Caja y Arqueo): denominations, initial cash, shift status
-- 5. Customer Credit Payments (Abonos de cartera)
-- ==============================================================================

-- 1. Enhance products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS aisle TEXT DEFAULT 'Pasillo 1',
ADD COLUMN IF NOT EXISTS cost_cop NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;

-- 2. Enhance customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS trade TEXT DEFAULT 'Vecino Particular',
ADD COLUMN IF NOT EXISTS club_tier TEXT DEFAULT 'Vecino Club',
ADD COLUMN IF NOT EXISTS credit_limit_cop NUMERIC(12, 2) DEFAULT 500000,
ADD COLUMN IF NOT EXISTS credit_balance_cop NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_purchases_cop NUMERIC(12, 2) DEFAULT 0;

-- 3. Enhance orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'web' CHECK (channel IN ('web', 'pos', 'counter')),
ADD COLUMN IF NOT EXISTS pickup_pin TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'efectivo';

-- 4. Create cash_shifts table for Caja & Arqueo
CREATE TABLE IF NOT EXISTS public.cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_name TEXT NOT NULL DEFAULT 'Administrador',
    shift_name TEXT NOT NULL DEFAULT 'Turno Mañana',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    initial_cash_cop NUMERIC(12, 2) NOT NULL DEFAULT 200000,
    counted_cash_cop NUMERIC(12, 2) NOT NULL DEFAULT 0,
    expected_cash_cop NUMERIC(12, 2) NOT NULL DEFAULT 0,
    difference_cop NUMERIC(12, 2) NOT NULL DEFAULT 0,
    denominations_json JSONB DEFAULT '{"50000": 14, "20000": 22, "10000": 18, "5000": 15, "2000": 20, "1000": 25, "500": 20}'::jsonb,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ,
    notes TEXT
);

-- Enable RLS on cash_shifts
ALTER TABLE public.cash_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow auth all cash_shifts" ON public.cash_shifts;
CREATE POLICY "Allow auth all cash_shifts" ON public.cash_shifts FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon read cash_shifts" ON public.cash_shifts;
CREATE POLICY "Allow anon read cash_shifts" ON public.cash_shifts FOR SELECT TO anon USING (true);

-- 5. Create customer_credit_payments table for Abonos
CREATE TABLE IF NOT EXISTS public.customer_credit_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    amount_cop NUMERIC(12, 2) NOT NULL CHECK (amount_cop > 0),
    payment_method TEXT NOT NULL DEFAULT 'efectivo',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on customer_credit_payments
ALTER TABLE public.customer_credit_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow auth all customer_credit_payments" ON public.customer_credit_payments;
CREATE POLICY "Allow auth all customer_credit_payments" ON public.customer_credit_payments FOR ALL TO authenticated USING (true);

-- ==============================================================================
-- Seed Data for Admin Screens
-- ==============================================================================

-- Update products with realistic aisles and costs
UPDATE public.products SET aisle = 'Pasillo 1 - Herramientas', cost_cop = price_cop * 0.65, min_stock = 4 WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'herramientas-electricas' LIMIT 1);
UPDATE public.products SET aisle = 'Pasillo 2 - Grifería', cost_cop = price_cop * 0.60, min_stock = 5 WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'plomeria-griferia' LIMIT 1);
UPDATE public.products SET aisle = 'Pasillo 3 - Pinturas', cost_cop = price_cop * 0.70, min_stock = 6 WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'pinturas-adhesivos' LIMIT 1);
UPDATE public.products SET aisle = 'Pasillo 4 - Fijaciones', cost_cop = price_cop * 0.55, min_stock = 8 WHERE category_id = (SELECT id FROM public.categories WHERE slug = 'tornilleria-fijaciones' LIMIT 1);

-- Seed Frequent Customers matching designs
INSERT INTO public.customers (full_name, email, phone, trade, club_tier, credit_limit_cop, credit_balance_cop, total_purchases_cop, address, city)
VALUES
('Hernán Morales', 'hernan.constructor@gmail.com', '3128419011', 'Maestro de Obra Constructor', 'Club Maestro Oro (10% Dcto)', 800000, 148900, 3450000, 'Pasaje Los Aromos #340', 'Bogotá'),
('Pedro Morales', 'pedro.morales@hotmail.com', '3157124433', 'Vecino Pasaje', 'Club Maestro Vecinal (5% Dcto)', 300000, 25980, 890000, 'Av. Central #1120', 'Bogotá'),
('Construcciones Del Valle S.A.S', 'compras@valleconstrucciones.com', '3005554321', 'Empresa Contratista Local', 'Tarifa Constructor (15% Dcto)', 2500000, 0, 12800000, 'Zona Industrial Manzana 4', 'Bogotá'),
('Carla Rivas (Comité Vecinal)', 'juntadevecinos12@gmail.com', '3106551120', 'Junta de Vecinos', 'Cuenta Institucional', 500000, 85000, 1450000, 'Unidad Vecinal #12 Los Cipreses', 'Bogotá'),
('Jaime Rincón', 'jaime.rincon.electric@gmail.com', '3149991122', 'Electricista Certificado', 'Club Electricista (10% Dcto)', 600000, 45000, 2100000, 'Calle 28 #14-08', 'Bogotá'),
('Gladys Rodríguez', 'gladys.rodriguez@yahoo.com', '3182223344', 'Vecina Propietaria', 'Vecina Frecuente (5% Dcto)', 200000, 0, 720000, 'Carrera 45 #12-30', 'Bogotá')
ON CONFLICT (email) DO UPDATE SET
    trade = excluded.trade,
    club_tier = excluded.club_tier,
    credit_balance_cop = excluded.credit_balance_cop,
    total_purchases_cop = excluded.total_purchases_cop;

-- Seed Sample Orders matching designs
INSERT INTO public.orders (order_number, customer_name, customer_email, customer_phone, delivery_type, status, subtotal_cop, tax_cop, total_cop, channel, pickup_pin, payment_method, created_at)
VALUES
('FM-2025-001', 'Juan Carlos Pérez', 'juan.perez@gmail.com', '3109876543', 'pickup', 'ready_for_pickup', 331932, 63068, 395000, 'web', '7492', 'webpay', now() - interval '25 minutes'),
('FM-2025-002', 'Construcciones Del Valle', 'compras@valleconstrucciones.com', '3005554321', 'pickup', 'preparing', 27310, 5190, 32500, 'web', '1024', 'transferencia', now() - interval '45 minutes'),
('FM-2025-003', 'Andrés Morales (Maestro)', 'andres.morales@gmail.com', '3154448899', 'pickup', 'delivered', 114285, 21715, 136000, 'web', '5561', 'efectivo', now() - interval '2 hours'),
('BOL-10492', 'Juan Pérez', 'juan.perez@gmail.com', '3109876543', 'pickup', 'delivered', 32773, 6227, 39000, 'pos', null, 'efectivo', now() - interval '30 minutes'),
('BOL-10493', 'Hernán Morales', 'hernan.constructor@gmail.com', '3128419011', 'pickup', 'delivered', 67227, 12773, 80000, 'pos', null, 'tarjeta', now() - interval '1 hour'),
('BOL-10494', 'Vecino Particular', 'vecino@gmail.com', '3110000000', 'pickup', 'delivered', 15126, 2874, 18000, 'pos', null, 'efectivo', now() - interval '10 minutes')
ON CONFLICT (order_number) DO NOTHING;

-- Seed Active Cash Shift
INSERT INTO public.cash_shifts (cashier_name, shift_name, status, initial_cash_cop, counted_cash_cop, expected_cash_cop, difference_cop, opened_at)
VALUES ('Administrador FerroMax', 'Turno Mañana', 'open', 200000, 1395000, 1395000, 0, now() - interval '6 hours')
ON CONFLICT DO NOTHING;

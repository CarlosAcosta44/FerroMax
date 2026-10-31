-- ========================================================
-- FERROMAX - Script Maestro de Creación y Carga Inicial
-- ========================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla: categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT DEFAULT 'wrench',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabla: products
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

-- 4. Tabla: customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    document_type TEXT DEFAULT 'CC' CHECK (document_type IN ('CC', 'NIT', 'CE', 'PP')),
    document_number TEXT,
    address TEXT,
    city TEXT DEFAULT 'Bogotá',
    is_frequent BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabla: orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    order_origin TEXT NOT NULL DEFAULT 'web' CHECK (order_origin IN ('web', 'pos_counter')),
    delivery_type TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'delivery', 'immediate_counter')),
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

-- 6. Tabla: order_items
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

-- 7. Tabla: payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    transaction_ref TEXT NOT NULL UNIQUE,
    payment_method TEXT NOT NULL CHECK (
        payment_method IN ('pse', 'credit_card', 'debit_card', 'cash', 'bank_transfer')
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

-- 8. Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON public.products(is_active, stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON public.payments(receipt_number);

-- 9. Disparador Transaccional de Descuento de Stock
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

-- 10. Políticas de Seguridad (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow auth all categories" ON public.categories;
CREATE POLICY "Allow auth all categories" ON public.categories FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read active products" ON public.products;
CREATE POLICY "Allow public read active products" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Allow auth all products" ON public.products;
CREATE POLICY "Allow auth all products" ON public.products FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert customers" ON public.customers;
CREATE POLICY "Allow public insert customers" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow auth read customers" ON public.customers;
CREATE POLICY "Allow auth read customers" ON public.customers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow auth all orders" ON public.orders;
CREATE POLICY "Allow auth all orders" ON public.orders FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert order_items" ON public.order_items;
CREATE POLICY "Allow public insert order_items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read order_items" ON public.order_items;
CREATE POLICY "Allow public read order_items" ON public.order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow auth all order_items" ON public.order_items;
CREATE POLICY "Allow auth all order_items" ON public.order_items FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert payments" ON public.payments;
CREATE POLICY "Allow public insert payments" ON public.payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read payments" ON public.payments;
CREATE POLICY "Allow public read payments" ON public.payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow auth all payments" ON public.payments;
CREATE POLICY "Allow auth all payments" ON public.payments FOR ALL TO authenticated USING (true);

-- 11. Datos Semilla (Categorías)
INSERT INTO public.categories (id, name, slug, description, icon_name, display_order)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Herramientas Eléctricas', 'herramientas-electricas', 'Taladros, pulidoras, sierras y rotomartillos de alta potencia', 'drill', 1),
    ('22222222-2222-2222-2222-222222222222', 'Herramientas Manuales', 'herramientas-manuales', 'Martillos, destornilladores, alicates, niveles y llaves de mano', 'hammer', 2),
    ('33333333-3333-3333-3333-333333333333', 'Plomería y Grifería', 'plomeria-griferia', 'Tuberías PVC, llaves de paso, uniones, sifones y pegamentos', 'droplet', 3),
    ('44444444-4444-4444-4444-444444444444', 'Electricidad e Iluminación', 'electricidad-iluminacion', 'Cables conductores, tomacorrientes, breakers y reflectores LED', 'zap', 4),
    ('55555555-5555-5555-5555-555555555555', 'Pinturas y Adhesivos', 'pinturas-adhesivos', 'Vinilos, esmaltes, anticorrosivos, siliconas y selladores', 'paintbrush', 5),
    ('66666666-6666-6666-6666-666666666666', 'Tornillería y Fijaciones', 'tornilleria-fijaciones', 'Tornillos drywall, chazos, pernos, remaches y clavos en caja', 'package', 6)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, display_order = EXCLUDED.display_order;

-- 12. Datos Semilla (Productos)
INSERT INTO public.products (category_id, name, slug, sku, brand, description, price_cop, cost_price_cop, stock_quantity, min_stock_alert, unit_measure, image_url, is_active, featured)
VALUES
    -- Herramientas Eléctricas
    ('11111111-1111-1111-1111-111111111111', 'Taladro Percutor 1/2" 650W DeWalt', 'taladro-percutor-dewalt-650w', 'DW-DWD024', 'DeWalt', 'Velocidad variable reversible, empuñadura lateral 360° y mandril metálico de 1/2 pulgada.', 289000, 220000, 8, 3, 'unidad', null, true, true),
    ('11111111-1111-1111-1111-111111111111', 'Pulidora Angular 4-1/2" 850W Bosch', 'pulidora-angular-bosch-850w', 'BS-GWS850', 'Bosch', 'Motor de alta durabilidad con guarda de protección antitorsión y bloqueo de husillo.', 245000, 185000, 4, 3, 'unidad', null, true, true),
    ('11111111-1111-1111-1111-111111111111', 'Sierra Caladora 500W Stanley', 'sierra-caladora-stanley-500w', 'ST-SJ45', 'Stanley', 'Selector de acción pendular en 3 posiciones y soplador de polvo integrado.', 198000, 149000, 2, 2, 'unidad', null, true, false),

    -- Herramientas Manuales
    ('22222222-2222-2222-2222-222222222222', 'Juego de Destornilladores 6 Piezas Stanley', 'juego-destornilladores-stanley-6pz', 'ST-62002', 'Stanley', 'Puntas magnetizadas resistentes con mangos bimaterial ergonómicos antideslizantes.', 42000, 28000, 15, 5, 'unidad', null, true, true),
    ('22222222-2222-2222-2222-222222222222', 'Martillo Uña Curva 16oz Mango Fibra Truper', 'martillo-una-curva-truper-16oz', 'TR-16652', 'Truper', 'Cabeza forjada en acero carbono con mango de fibra de vidrio absorbente de impactos.', 36500, 24000, 12, 4, 'unidad', null, true, false),
    ('22222222-2222-2222-2222-222222222222', 'Alicate Universal 8 Pulgadas Irwin Profesional', 'alicate-universal-irwin-8in', 'IR-2078108', 'Irwin', 'Acero níquel cromo tratado térmicamente con filo endurecido para corte de alambre duro.', 48000, 32000, 6, 3, 'unidad', null, true, false),
    ('22222222-2222-2222-2222-222222222222', 'Flexómetro Cinta Métrica 5 Metros Stanley', 'flexometro-cinta-metrica-5m', 'ST-30495', 'Stanley', 'Cinta revestida en polímero antiabrasión con botón de freno firme y gancho cero absoluto.', 18500, 11000, 25, 8, 'unidad', null, true, true),

    -- Plomería y Grifería
    ('33333333-3333-3333-3333-333333333333', 'Tubo PVC Presión 1/2" Tramo 3 Metros Pavco', 'tubo-pvc-presion-pavco-1-2-3m', 'PV-100234', 'Pavco Wavin', 'Tubo hidráulico de alta resistencia para conducción de agua potable a presión RDE 9.', 16800, 11500, 30, 10, 'unidad', null, true, false),
    ('33333333-3333-3333-3333-333333333333', 'Soldadura PVC Líquida 1/4 Galón Pavco', 'soldadura-pvc-pavco-cuarto-galon', 'PV-200155', 'Pavco Wavin', 'Pegamento solvente extrafuerte de secado rápido para tuberías y accesorios de PVC.', 34000, 23000, 9, 4, 'unidad', null, true, false),
    ('33333333-3333-3333-3333-333333333333', 'Cinta Teflón Profesional 3/4" x 10m', 'cinta-teflon-profesional-3-4', 'TF-7510', 'Genérico', 'Sellador de roscas para conexiones hidrosanitarias a prueba de goteos y fugas.', 3200, 1500, 60, 15, 'unidad', null, true, false),

    -- Electricidad e Iluminación
    ('44444444-4444-4444-4444-444444444444', 'Rollo Cable Eléctrico #12 AWG 100 Metros Centelsa', 'rollo-cable-electrico-12-awg-100m', 'CB-12100', 'Centelsa', 'Cable de cobre 100% puro certificado con aislamiento termoplástico THHN retardante a la llama.', 215000, 175000, 5, 2, 'rollo', null, true, true),
    ('44444444-4444-4444-4444-444444444444', 'Reflector LED Exterior 50W IP65 Luz Blanca', 'reflector-led-exterior-50w-ip65', 'RF-LED50', 'Vitel', 'Carcasa de aluminio inyectado para intemperie, alta eficiencia lumínica de bajo consumo.', 49900, 31000, 14, 4, 'unidad', null, true, false),
    ('44444444-4444-4444-4444-444444444444', 'Cinta Aislante Negra 20 Metros 3M Temflex', 'cinta-aislante-3m-temflex-20m', '3M-1700', '3M', 'Aislante dieléctrico de PVC resistente a la humedad y temperaturas hasta 80°C.', 6500, 3800, 45, 12, 'unidad', null, true, false),

    -- Pinturas y Adhesivos
    ('55555555-5555-5555-5555-555555555555', 'Pintura Vinilo Tipo 1 Blanco Galón Pintuco', 'pintura-vinilo-tipo-1-blanco-galon', 'PT-VIN1B', 'Pintuco', 'Pintura plástica base agua de alto cubrimiento y máxima lavabilidad para paredes de interior.', 68000, 49000, 11, 4, 'galon', null, true, true),
    ('55555555-5555-5555-5555-555555555555', 'Silicona Neutra Multiuso Transparente 280ml Sika', 'silicona-neutra-sikasil-ia-280ml', 'SK-SIL280', 'Sika', 'Sellador elástico antihongos para juntas en baños, cocinas, vidrio y carpintería.', 19500, 12500, 18, 5, 'unidad', null, true, false),

    -- Tornillería y Fijaciones
    ('66666666-6666-6666-6666-666666666666', 'Caja Tornillo Drywall 6x1" (1000 Unidades)', 'caja-tornillo-drywall-6x1-1000u', 'TR-DW61', 'Mamut', 'Punta aguda fosfatada negra para placas de yeso y estructuras de madera liviana.', 32000, 20000, 20, 6, 'caja', null, true, true),
    ('66666666-6666-6666-6666-666666666666', 'Caja Chazo Plástico 5/16" con Tornillo (100 Uds)', 'caja-chazo-plastico-5-16-100u', 'CH-516100', 'Genérico', 'Fijación segura para paredes de mampostería, ladrillo macizo y bloque hueco.', 14000, 8500, 35, 10, 'caja', null, true, false)
ON CONFLICT (slug) DO UPDATE
SET price_cop = EXCLUDED.price_cop,
    stock_quantity = EXCLUDED.stock_quantity,
    min_stock_alert = EXCLUDED.min_stock_alert,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    featured = EXCLUDED.featured,
    updated_at = now();

-- 13. Clientes Frecuentes Iniciales
INSERT INTO public.customers (full_name, email, phone, document_type, document_number, address, is_frequent, notes)
VALUES
    ('Maestro Jairo Silva', 'jairo.silva.obras@gmail.com', '3104567890', 'CC', '79845123', 'Barrio San Carlos Calle 48 #12-30', true, 'Contratista de plomería y remodelaciones. Compra tubos Pavco y cemento.'),
    ('Albañil Pedro Gómez', 'pedro.gomez.const@gmail.com', '3157891234', 'CC', '19456782', 'Carrera 14 #32-15', true, 'Especialista en drywall y pintura. Descuento habitual en cajas de tornillos.'),
    ('Electricista Marco Ruiz', 'marco.ruiz.tec@gmail.com', '3209876543', 'CC', '80123987', 'Calle 52 #20-40', true, 'Técnico electricista certificado. Compra rollos de cable Centelsa.')
ON CONFLICT DO NOTHING;


-- ==============================================================================
-- ==============================================================================
-- FerroMax: User Profiles & Roles System
-- Supports 'admin' (Don Carlos / Store Owner) and 'cliente' (Default Buyer)
-- All new registrations default to 'cliente'. Roles are managed directly in Supabase.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'cliente')) DEFAULT 'cliente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Function & Trigger to automatically synchronize profile on user signup
-- New accounts ALWAYS default to 'cliente'. Roles are managed directly in Supabase.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'phone', ''),
        'cliente'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = excluded.email,
        full_name = COALESCE(NULLIF(excluded.full_name, ''), public.profiles.full_name),
        phone = COALESCE(NULLIF(excluded.phone, ''), public.profiles.phone),
        role = public.profiles.role,
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


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

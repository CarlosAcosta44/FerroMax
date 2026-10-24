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
-- FerroMax: User Profiles & Roles System
-- Supports 'admin' (Don Carlos / Store Owner) and 'cliente' (Retail Buyer)
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
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'phone', ''),
        COALESCE(new.raw_user_meta_data->>'role', 'cliente')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = excluded.email,
        full_name = COALESCE(NULLIF(excluded.full_name, ''), public.profiles.full_name),
        phone = COALESCE(NULLIF(excluded.phone, ''), public.profiles.phone),
        role = COALESCE(NULLIF(excluded.role, ''), public.profiles.role),
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

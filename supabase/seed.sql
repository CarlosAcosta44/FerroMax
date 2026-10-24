-- ========================================================
-- FERROMAX - Seed Data for Hardware Catalog
-- ========================================================

-- Insert Categories
INSERT INTO public.categories (id, name, slug, description, icon_name, display_order)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Herramientas Eléctricas', 'herramientas-electricas', 'Taladros, pulidoras, sierras y rotomartillos de alta potencia', 'drill', 1),
    ('22222222-2222-2222-2222-222222222222', 'Herramientas Manuales', 'herramientas-manuales', 'Martillos, destornilladores, alicates, niveles y llaves de mano', 'hammer', 2),
    ('33333333-3333-3333-3333-333333333333', 'Plomería y Grifería', 'plomeria-griferia', 'Tuberías PVC, llaves de paso, uniones, sifones y pegamentos', 'droplet', 3),
    ('44444444-4444-4444-4444-444444444444', 'Electricidad e Iluminación', 'electricidad-iluminacion', 'Cables conductores, tomacorrientes, breakers y reflectores LED', 'zap', 4),
    ('55555555-5555-5555-5555-555555555555', 'Pinturas y Adhesivos', 'pinturas-adhesivos', 'Vinilos, esmaltes, anticorrosivos, siliconas y selladores', 'paintbrush', 5),
    ('66666666-6666-6666-6666-666666666666', 'Tornillería y Fijaciones', 'tornilleria-fijaciones', 'Tornillos drywall, chazos, pernos, remaches y clavos en caja', 'package', 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert Products
INSERT INTO public.products (category_id, name, slug, sku, brand, description, price_cop, cost_price_cop, stock_quantity, min_stock_alert, unit_measure, image_url, is_active, featured)
VALUES
    -- Herramientas Eléctricas
    ('11111111-1111-1111-1111-111111111111', 'Taladro Percutor 1/2" 650W', 'taladro-percutor-dewalt-650w', 'DW-DWD024', 'DeWalt', 'Velocidad variable reversible, empuñadura lateral 360° y mandril de 1/2 pulgada.', 289000, 220000, 8, 3, 'unidad', '/products/taladro-dewalt.webp', true, true),
    ('11111111-1111-1111-1111-111111111111', 'Pulidora Angular 4-1/2" 850W', 'pulidora-angular-bosch-850w', 'BS-GWS850', 'Bosch', 'Motor de alta durabilidad con guarda de protección y bloqueo de eje para cambio rápido de disco.', 245000, 185000, 4, 3, 'unidad', '/products/pulidora-bosch.webp', true, true),
    ('11111111-1111-1111-1111-111111111111', 'Sierra Caladora 500W', 'sierra-caladora-stanley-500w', 'ST-SJ45', 'Stanley', 'Selector de acción pendular en 3 posiciones y soplador de polvo integrado.', 198000, 149000, 2, 2, 'unidad', '/products/caladora-stanley.webp', true, false),

    -- Herramientas Manuales
    ('22222222-2222-2222-2222-222222222222', 'Juego de Destornilladores 6 Piezas', 'juego-destornilladores-stanley-6pz', 'ST-62002', 'Stanley', 'Puntas magnetizadas resistentes con mangos bimaterial ergonómicos antideslizantes.', 42000, 28000, 15, 5, 'unidad', '/products/destornilladores-stanley.webp', true, true),
    ('22222222-2222-2222-2222-222222222222', 'Martillo Uña Curva 16oz Mango Fibra', 'martillo-una-curva-truper-16oz', 'TR-16652', 'Truper', 'Cabeza forjada en acero carbono con mango de fibra de vidrio absorbente de impactos.', 36500, 24000, 12, 4, 'unidad', '/products/martillo-truper.webp', true, false),
    ('22222222-2222-2222-2222-222222222222', 'Alicate Universal 8 Pulgadas Profesional', 'alicate-universal-irwin-8in', 'IR-2078108', 'Irwin', 'Acero níquel cromo tratado térmicamente con filo endurecido para corte de cables duros.', 48000, 32000, 6, 3, 'unidad', '/products/alicate-irwin.webp', true, false),
    ('22222222-2222-2222-2222-222222222222', 'Flexómetro Cinta Métrica 5 Metros', 'flexometro-cinta-metrica-5m', 'ST-30495', 'Stanley', 'Cinta revestida en polímero antiabrasión con botón de freno firme y clip para cinturón.', 18500, 11000, 25, 8, 'unidad', '/products/flexometro-5m.webp', true, true),

    -- Plomería y Grifería
    ('33333333-3333-3333-3333-333333333333', 'Tubo PVC Presión 1/2" Tramo 3 Metros', 'tubo-pvc-presion-pavco-1-2-3m', 'PV-100234', 'Pavco Wavin', 'Tubo hidráulico de alta resistencia para conducción de agua potable a presión.', 16800, 11500, 30, 10, 'unidad', '/products/tubo-pvc-1-2.webp', true, false),
    ('33333333-3333-3333-3333-333333333333', 'Soldadura PVC Líquida 1/4 Galón', 'soldadura-pvc-pavco-cuarto-galon', 'PV-200155', 'Pavco Wavin', 'Pegamento solvente extrafuerte de secado rápido para tuberías y accesorios de PVC.', 34000, 23000, 9, 4, 'unidad', '/products/soldadura-pvc.webp', true, false),
    ('33333333-3333-3333-3333-333333333333', 'Cinta Teflón Profesional 3/4" x 10m', 'cinta-teflon-profesional-3-4', 'TF-7510', 'Genérico', 'Sellador de roscas para conexiones hidrosanitarias a prueba de goteos y fugas.', 3200, 1500, 60, 15, 'unidad', '/products/teflon.webp', true, false),

    -- Electricidad e Iluminación
    ('44444444-4444-4444-4444-444444444444', 'Rollo Cable Eléctrico #12 AWG 100 Metros', 'rollo-cable-electrico-12-awg-100m', 'CB-12100', 'Centelsa', 'Cable de cobre 100% puro con aislamiento termoplástico THHN retardante a la llama.', 215000, 175000, 5, 2, 'rollo', '/products/cable-12.webp', true, true),
    ('44444444-4444-4444-4444-444444444444', 'Reflector LED Exterior 50W IP65 Luz Blanca', 'reflector-led-exterior-50w-ip65', 'RF-LED50', 'Vitel', 'Carcasa de aluminio inyectado para intemperie, alta eficiencia lumínica de bajo consumo.', 49900, 31000, 14, 4, 'unidad', '/products/reflector-led.webp', true, false),
    ('44444444-4444-4444-4444-444444444444', 'Cinta Aislante Negra 20 Metros', 'cinta-aislante-3m-temflex-20m', '3M-1700', '3M', 'Aislante dieléctrico de PVC resistente a la humedad y temperaturas hasta 80°C.', 6500, 3800, 45, 12, 'unidad', '/products/cinta-3m.webp', true, false),

    -- Pinturas y Adhesivos
    ('55555555-5555-5555-5555-555555555555', 'Pintura Vinilo Tipo 1 Blanco Galón', 'pintura-vinilo-tipo-1-blanco-galon', 'PT-VIN1B', 'Pintuco', 'Pintura plástica base agua de alto cubrimiento y máxima lavabilidad para interiores.', 68000, 49000, 11, 4, 'galon', '/products/vinilo-blanco.webp', true, true),
    ('55555555-5555-5555-5555-555555555555', 'Silicona Neutra Multiuso Transparente 280ml', 'silicona-neutra-sikasil-ia-280ml', 'SK-SIL280', 'Sika', 'Sellador elástico antihongos para juntas en baños, cocinas, vidrio y carpintería.', 19500, 12500, 18, 5, 'unidad', '/products/silicona-sika.webp', true, false),

    -- Tornillería y Fijaciones
    ('66666666-6666-6666-6666-666666666666', 'Caja Tornillo Drywall 6x1" (1000 Unidades)', 'caja-tornillo-drywall-6x1-1000u', 'TR-DW61', 'Mamut', 'Punta aguda fosfatada negra para placas de yeso y estructuras de madera liviana.', 32000, 20000, 20, 6, 'caja', '/products/tornillos-drywall.webp', true, true),
    ('66666666-6666-6666-6666-666666666666', 'Caja Chazo Plástico 5/16" con Tornillo (100 Uds)', 'caja-chazo-plastico-5-16-100u', 'CH-516100', 'Genérico', 'Fijación segura para paredes de mampostería, ladrillo y bloque hueco.', 14000, 8500, 35, 10, 'caja', '/products/chazos-516.webp', true, false)
ON CONFLICT (slug) DO NOTHING;

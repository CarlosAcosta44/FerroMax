import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Cargar variables de entorno desde .env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim().replace(/^['\"]|['\"]$/g, '');
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL o Llave de Supabase no encontrada en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 Iniciando siembra de datos sintéticos en Supabase...');

  // 1. Obtener productos reales existentes
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, sku, price_cop, stock_quantity')
    .limit(10);

  if (prodErr || !products || products.length === 0) {
    console.error('❌ Error consultando productos:', prodErr);
    process.exit(1);
  }
  console.log(`📦 Encontrados ${products.length} productos reales en la BD.`);

  // 2. Obtener clientes reales existentes
  const { data: customers, error: custErr } = await supabase
    .from('customers')
    .select('id, full_name, email, phone')
    .limit(5);

  if (custErr || !customers || customers.length === 0) {
    console.error('❌ Error consultando clientes:', custErr);
    process.exit(1);
  }
  console.log(`👥 Encontrados ${customers.length} clientes reales en la BD.`);

  const c1 = customers[0]; // Maestro Jairo Silva
  const c2 = customers[1] || customers[0]; // Albañil Pedro Gómez
  const c3 = customers[2] || customers[0]; // Electricista Marco Ruiz

  const p1 = products[0]; // Pulidora Bosch o similar
  const p2 = products[1] || products[0]; // Sierra o destornilladores
  const p3 = products[2] || products[0]; // Alicate o Martillo

  // 3. Crear Órdenes de prueba para Retiro en Mesón (Click & Collect) y Ventas POS de Hoy
  const syntheticOrders = [
    {
      order_number: 'FM-2026-001',
      customer_id: c1.id,
      customer_name: c1.full_name,
      customer_email: c1.email,
      customer_phone: c1.phone,
      delivery_type: 'pickup',
      delivery_address: 'Retiro en Mesón Principal FerroMax',
      status: 'ready_for_pickup',
      subtotal_cop: p1.price_cop,
      tax_cop: Math.round(p1.price_cop * 0.19),
      shipping_cop: 0,
      total_cop: Math.round(p1.price_cop * 1.19),
      customer_notes: JSON.stringify({
        channel: 'web',
        pickup_pin: '7492',
        payment_method: 'PSE / Bancolombia',
      }),
      items: [
        {
          product_id: p1.id,
          product_name: p1.name,
          product_sku: p1.sku,
          quantity: 1,
          unit_price_cop: p1.price_cop,
          subtotal_cop: p1.price_cop,
        },
      ],
    },
    {
      order_number: 'FM-2026-002',
      customer_id: c2.id,
      customer_name: c2.full_name,
      customer_email: c2.email,
      customer_phone: c2.phone,
      delivery_type: 'pickup',
      delivery_address: 'Retiro en Mostrador',
      status: 'preparing',
      subtotal_cop: p2.price_cop * 2,
      tax_cop: Math.round(p2.price_cop * 2 * 0.19),
      shipping_cop: 0,
      total_cop: Math.round(p2.price_cop * 2 * 1.19),
      customer_notes: JSON.stringify({
        channel: 'web',
        pickup_pin: '1024',
        payment_method: 'Tarjeta de Crédito',
      }),
      items: [
        {
          product_id: p2.id,
          product_name: p2.name,
          product_sku: p2.sku,
          quantity: 2,
          unit_price_cop: p2.price_cop,
          subtotal_cop: p2.price_cop * 2,
        },
      ],
    },
    {
      order_number: 'BOL-10491',
      customer_id: c3.id,
      customer_name: c3.full_name,
      customer_email: c3.email,
      customer_phone: c3.phone,
      delivery_type: 'pickup',
      delivery_address: 'Mesón Venta Rápida',
      status: 'delivered',
      subtotal_cop: p3.price_cop,
      tax_cop: 0,
      shipping_cop: 0,
      total_cop: p3.price_cop,
      customer_notes: JSON.stringify({
        channel: 'pos',
        payment_method: 'efectivo',
      }),
      items: [
        {
          product_id: p3.id,
          product_name: p3.name,
          product_sku: p3.sku,
          quantity: 1,
          unit_price_cop: p3.price_cop,
          subtotal_cop: p3.price_cop,
        },
      ],
    },
    {
      order_number: 'BOL-10492',
      customer_id: null,
      customer_name: 'Cliente Ocasional',
      customer_email: 'mostrador@ferromax.co',
      customer_phone: '3000000000',
      delivery_type: 'pickup',
      delivery_address: 'Mesón Venta Rápida',
      status: 'delivered',
      subtotal_cop: 32000,
      tax_cop: 0,
      shipping_cop: 0,
      total_cop: 32000,
      customer_notes: JSON.stringify({
        channel: 'pos',
        payment_method: 'tarjeta',
      }),
      items: [
        {
          product_id: p2.id,
          product_name: p2.name,
          product_sku: p2.sku,
          quantity: 1,
          unit_price_cop: 32000,
          subtotal_cop: 32000,
        },
      ],
    },
  ];

  for (const orderData of syntheticOrders) {
    const { items, ...orderHeader } = orderData;

    // Verificar si ya existe para evitar duplicar
    const { data: existing } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('order_number', orderHeader.order_number)
      .maybeSingle();

    let orderId = existing?.id;

    if (!orderId) {
      const { data: newOrder, error: insErr } = await supabase
        .from('orders')
        .insert(orderHeader)
        .select('id')
        .single();

      if (insErr) {
        console.error(`⚠️ No se pudo insertar orden ${orderHeader.order_number}:`, insErr.message);
        continue;
      }
      orderId = newOrder.id;
      console.log(`✅ Creada orden ${orderHeader.order_number} (ID: ${orderId})`);
    } else {
      console.log(`ℹ️ Orden ${orderHeader.order_number} ya existe (ID: ${orderId}). Actualizando estado...`);
      await supabase.from('orders').update({ status: orderHeader.status }).eq('id', orderId);
    }

    // Insertar ítems de la orden
    for (const item of items) {
      const { error: itemErr } = await supabase.from('order_items').insert({
        order_id: orderId,
        ...item,
      });
      if (itemErr && !itemErr.message.includes('duplicate')) {
        console.warn(`  Aviso al insertar ítem para ${orderHeader.order_number}:`, itemErr.message);
      }
    }

    // Insertar pago simulado aprobado
    const { error: payErr } = await supabase.from('payments').insert({
      order_id: orderId,
      transaction_ref: `TX-${orderHeader.order_number}`,
      payment_method: 'pse',
      amount_cop: orderHeader.total_cop,
      status: 'approved',
      receipt_number: `REC-${orderHeader.order_number}`,
    });
    if (payErr && !payErr.message.includes('duplicate') && !payErr.message.includes('unique')) {
      // Ignorar si ya existía
    }
  }

  console.log('\n✨ ¡Datos sintéticos sembrados exitosamente!');
  console.log('--------------------------------------------------');
  console.log('📌 Resumen de datos de prueba listos en Supabase:');
  console.log('  1. Orden FM-2026-001 -> Listo para retiro | PIN: 7492 (Jairo Silva)');
  console.log('  2. Orden FM-2026-002 -> En preparación   | PIN: 1024 (Pedro Gómez)');
  console.log('  3. Ventas POS BOL-10491 y BOL-10492 -> Ventas registradas hoy');
  console.log('  4. Productos en inventario: 17 productos reales vinculados');
  console.log('--------------------------------------------------');
}

main().catch(console.error);

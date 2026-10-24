#!/usr/bin/env bash
set -e

CONN_STR="${1:-$DATABASE_URL}"

if [ -z "$CONN_STR" ]; then
  # Fallback to connection string provided
  CONN_STR="postgresql://postgres:27dedicde2007@db.hbjtgvfattuhjnwdwage.supabase.co:5432/postgres"
fi

SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/supabase/full_setup.sql"

echo "=========================================================="
echo "🛠️  FERROMAX - Ejecutor de Base de Datos Supabase"
echo "=========================================================="
echo "Script SQL: $SCRIPT_PATH"
echo ""

if ! command -v psql &> /dev/null; then
  echo "❌ Error: 'psql' no está instalado en este sistema."
  exit 1
fi

echo "Intentando ejecutar migración en Supabase PostgreSQL..."
if psql "$CONN_STR" -f "$SCRIPT_PATH"; then
  echo ""
  echo "✅ ¡Base de datos y datos iniciales creados exitosamente!"
else
  echo ""
  echo "⚠️ La conexión directa con psql no pudo completarse (habitual si tu red local no tiene enrutamiento IPv6 activo)."
  echo "📌 Para aplicarlo en 10 segundos:"
  echo "1. Abre el SQL Editor de tu proyecto en Supabase:"
  echo "   https://supabase.com/dashboard/project/hbjtgvfattuhjnwdwage/sql"
  echo "2. Copia y pega el contenido del archivo: supabase/full_setup.sql"
  echo "3. Haz clic en 'Run'. ¡Y listo!"
fi

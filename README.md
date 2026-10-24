# FerroMax – Ferretería y Herramientas 🛠️
> **Demo Showcase para Telar Web**  
> Demostración de digitalización comercial, catálogo con inventario en tiempo real y portal de pagos para una ferretería tradicional de venta al detal.

---

## 📌 Descripción del Proyecto
**FerroMax** es una solución web completa diseñada para modernizar una ferretería común de barrio o sector comercial. Permite a los clientes (vecinos, familias y trabajadores independientes locales como electricistas, plomeros o pintores) consultar la disponibilidad física de herramientas y materiales en tiempo real, comprar en línea con métodos de pago locales (PSE, tarjeta) y descargar sus recibos comerciales oficiales, a la vez que proporciona al dueño un panel simplificado para actualizar stock y precios en un solo clic.

---

## 🚀 Stack Tecnológico
Siguiendo los estándares del ecosistema **Telar Web**:
- **Framework Web**: [Next.js](https://nextjs.org/) (App Router, React 19, Server Components y Server Actions).
- **Lenguaje**: TypeScript (tipado estricto).
- **Estilos y Diseño**: [Tailwind CSS v4](https://tailwindcss.com/) con diseño temático industrial y moderno.
- **Validación de Esquemas**: [Zod](https://zod.dev/).
- **Base de Datos & Backend**: [Supabase](https://supabase.com/) (PostgreSQL 15+, Supabase Realtime para stock en vivo y Row Level Security).
- **Arquitectura de Software**: Clean Architecture adaptada a Next.js (`domain`, `application`, `infrastructure`, `presentation`).

---

## 📂 Documentación Completa (`.docs/`)
Toda la especificación técnica y de negocio se encuentra documentada en la carpeta [`.docs/`](./.docs):
- [`context.md`](./.docs/context.md): Contexto general, problemas resueltos y user journey.
- [`architecture.md`](./.docs/architecture.md): Clean Architecture, flujo de datos y patrones de diseño.
- [`database.md`](./.docs/database.md): Diagrama ERD, esquema SQL, funciones transaccionales y RLS.
- [`planning.md`](./.docs/planning.md): Estructura de vistas (UI/UX) y roadmap de 4 Fases.
- [`business_rules.md`](./.docs/business_rules.md): Reglas de inventario en tiempo real, prevención de sobreventa y WhatsApp First.

---

## 🛠️ Convenciones de Desarrollo
- **Gitflow**: Rama de producción `main`, rama de integración `develop`, ramas de trabajo `feature/*`, `release/*` y `hotfix/*`.
- **Commits Semánticos**: Formato Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).

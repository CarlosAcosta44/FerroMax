---
name: Industrial Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002109'
  on-tertiary-container: '#009844'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#66ff8e'
  tertiary-fixed-dim: '#3de273'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005322'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is tailored for an industrial supply and hardware ecosystem serving contractors, industrial maintenance teams, tradespeople, and serious residential builders. The identity bridges rigorous commercial utility with high-efficiency procurement.

### Tone & Personality
- **Authoritative & Sturdy:** Reliable, structural, and unyielding. The visual hierarchy communicates technical competence, stock accuracy, and enterprise-grade reliability.
- **Action-Oriented & Efficient:** High contrast and functional density prioritize fast SKUs search, bulk purchasing, and rapid technical spec lookups.
- **Modern Industrial:** Moves away from cluttered, dusty retail hardware aesthetics toward a clean, engineered interface that feels like a precision tool.

### Design Movement
The system balances **Modern Structural B2B** with crisp **tactile utility**. Surfaces rely on clean division, subtle containment outlines (`#E2E8F0`), and focused, high-visibility contrast nodes that elevate crucial interactions like instant purchasing and direct procurement communication.

## Colors

The palette establishes heavy contrast between institutional corporate stability and decisive industrial execution.

### Palette Architecture
- **Primary Canvas (`#F8FAFC`):** Ultra-light slate creates a calm, glare-free, durable background optimized for high data density, tabular specs, and catalog navigation.
- **Deep Slate Anchors (`#0F172A`):** Used for top navigation, command bars, hero sections, and high-impact structural framing. Establishes institutional weight and authority.
- **Industrial Orange Action (`#F97316`):** Reserved exclusively for primary conversion points, critical alerts, cart actions, and direct RFQs (Requests for Quote).
- **Direct Channel WhatsApp (`#25D366`):** Dedicated communication token for live contractor desk inquiries, instant quotes, and order reconciliation via messaging.
- **Inventory & Operational Badging:**
  - *In-Stock Surface:* `#DCFCE7` (Mint tint) paired with `#15803D` (Forest green label).
  - *Low Stock / Warning:* `#FEF3C7` surface with `#B45309` amber text.
  - *Critical Out-of-Stock:* `#FEE2E2` surface with `#B91C1C` ruby text.
- **Surfaces & Borders:** Neutral white (`#FFFFFF`) for elevated cards, framed by slate borders (`#E2E8F0`) to ensure crisp element separation in harsh sunlight or warehouse environments.

## Typography

The typographic hierarchy uses **Inter** across all display, body, and UI functions, complemented by **JetBrains Mono** strictly for technical SKU identifiers, bolt tolerances, DIN norms, and barcode references.

### Application Rules
- **Headlines & Display:** Strong negative letter spacing (`-0.02em`) creates a tightly knit, engineered look suitable for industrial tooling headers.
- **Labels & SKU Badges:** Medium and bold weights with positive tracking ensure instant scanability on warehouse mobile tablets and field phones.
- **Numbers & Pricing:** Tabular figures (`font-variant-numeric: tabular-nums`) must be activated across all pricing, inventory stock quantities, and dimensional specs to align cleanly across dense tables.

## Layout & Spacing

The layout is built around a standard 12-column responsive fluid grid designed to accommodate dense product grids, facet filters, and technical spec sheets.

### Grid & Breakpoints
- **Desktop (1280px+):** 12 columns, `margin: 2rem`, `gutter: 1.25rem`. Max content container capped at `1440px`. Left rail reserved for technical faceted filtering (category trees, brands, thread sizes, amperage).
- **Tablet (768px – 1279px):** 8 columns, `margin: 1.5rem`, `gutter: 1rem`. Filters collapse into a slide-over drawer; cards reflow to 2 or 3 items per row.
- **Mobile (320px – 767px):** 4 columns, `margin-mobile: 1rem`, `gutter-mobile: 0.75rem`. Dense list-view toggle available to support rapid industrial repurchasing.

### Spacing Principles
Component density favors compact vertical rhythms. Use `space-xs` and `space-sm` for inline micro-badges (SKUs, units per box, stock indicators) and `space-md` for standard card interiors to maximize screen real estate without feeling cluttered.

## Elevation & Depth

Visual hierarchy combines a flat structured base with soft atmospheric drop shadows, avoiding deep artistic blurs in favor of clean, physical layering.

### Surface Hierarchy
1. **Base Surface (Level 0):** `#F8FAFC` slate canvas for the page background.
2. **Structural Enclosures (Level 1):** `#FFFFFF` cards, drawers, and panels framed by a 1px solid `#E2E8F0` border. Paired with a delicate ambient shadow:
   `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`.
3. **Elevated Overlays & Flyouts (Level 2):** Cart dropdowns, SKU preview modals, and sticky action headers use:
   `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`.
4. **Command Layer (Level 3):** Global top navigation (`#0F172A`) sits high on the z-axis, remaining flat with zero shadow blur, using clean border delineation (`border-bottom: 1px solid #1E293B`) to preserve stark clarity.

## Shapes

The interface adopts a **Soft Industrial** geometry (`roundedness: 1`). Radii are strictly constrained to retain a robust, tool-like appearance:

- **Base Components (0.25rem / 4px):** Applied to technical chips, inventory tags, form inputs, checkboxes, and bulk stepper controls. Sharp enough to feel industrial, soft enough to prevent harshness.
- **Cards & Containment Blocks (0.5rem / 8px):** Applied to product cards, spec sheet tables, quotation modules, and hero containers.
- **Floating Modals & Sheets (0.75rem / 12px):** Applied to checkout modals and large dialog surfaces.
- **Pill Exceptions:** Rounded-full is prohibited except for circular indicator dots or compact count indicators.

## Components

### Buttons
- **Primary Industrial CTA:** Background `#F97316`, text `#FFFFFF`, font-weight 600, 4px border radius. Hover state transitions to `#EA580C`. Active state `#C2410C`. Focus ring: 2px offset with `#F97316`.
- **Secondary Corporate Action:** Background `#0F172A`, text `#FFFFFF`. Hover: `#1E293B`. Used for corporate account actions, downloading specification sheets, and quote management.
- **WhatsApp Direct Inquiries:** Background `#25D366`, text `#FFFFFF`, icon left-aligned. Hover: `#22C55E`. Dedicated to instant quotation and bulk logistics messaging.
- **Ghost / Utility:** Transparent background, 1px border `#CBD5E1`, text `#334155`. Hover: background `#F1F5F9`.

### Product Cards
- **Construction:** Background `#FFFFFF`, 1px border `#E2E8F0`, 8px corner radius.
- **Layout:** Top section houses SKU number in `label-code` format (`#64748B`) and stock availability badge. Center hosts product image on a clear `#FFFFFF` or `#F8FAFC` neutral plate. Bottom area displays technical title, pack quantity, wholesale/retail dual pricing, and a full-width or icon-based primary `#F97316` action button.
- **Hover:** Subtle lift (`transform: translateY(-2px)`) with shadow elevation to level 2 and border color accentuating to `#CBD5E1`.

### Stock Badges & Chips
- **In Stock:** `#DCFCE7` background, `#15803D` typography, 4px corner radius, `space-xs` padding vertical, `space-sm` horizontal. Features a 6px solid `#16A34A` status dot.
- **Technical Attribute Chips:** `#F1F5F9` background, `#475569` text, 4px radius. Used for voltage, horsepower, material grade, and thread diameter.

### Inputs & Quantity Selectors
- **Fields:** Background `#FFFFFF`, border 1px `#CBD5E1`, text `#0F172A`, placeholder `#94A3B8`. Focus: border `#0F172A` with a 1px outline or `#F97316` for checkout flows.
- **Bulk Quantity Stepper:** Unified segment with left decrement button, center mono numeric input, and right increment button bound in a single `#E2E8F0` border group.

### Checkboxes & Radios
- Square 4px border radius for checkboxes, circle for radios.
- Unchecked: `#FFFFFF` with `#94A3B8` border.
- Checked: Background `#0F172A` with white checkmark icon for filters, or `#F97316` for critical purchase confirmations.

### Domain-Specific Components
- **B2B Tiered Price Table:** Compact rows with zebra striping (`#F8FAFC`), showing unit breakdown (1-9 pcs, 10-49 pcs, 50+ pcs) with active tier highlighted in faint orange (`#FFF7ED`).
- **Technical Spec Accordion:** Dense, border-bottom separated `#E2E8F0` rows pairing key-value specs (e.g., "Torque: 85 Nm", "Voltage: 20V Max") with high legibility.
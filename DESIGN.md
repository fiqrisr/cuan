---
name: Obsidian & Emerald
colors:
  surface: "#111413"
  surface-dim: "#111413"
  surface-bright: "#373a38"
  surface-container-lowest: "#0c0f0d"
  surface-container-low: "#1a1c1b"
  surface-container: "#1e201f"
  surface-container-high: "#282a29"
  surface-container-highest: "#333534"
  on-surface: "#e2e3e0"
  on-surface-variant: "#c4c7c4"
  inverse-surface: "#e2e3e0"
  inverse-on-surface: "#2f312f"
  outline: "#8e928f"
  outline-variant: "#444845"
  surface-tint: "#c6c7c4"
  primary: "#c6c7c4"
  on-primary: "#2f3130"
  primary-container: "#0f1110"
  on-primary-container: "#7c7d7b"
  inverse-primary: "#5d5f5d"
  secondary: "#9fd1ba"
  on-secondary: "#023828"
  secondary-container: "#1f4f3d"
  on-secondary-container: "#8ec0a9"
  tertiary: "#c7c6c5"
  on-tertiary: "#2f3130"
  tertiary-container: "#0f1110"
  on-tertiary-container: "#7c7d7b"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#e2e3e0"
  primary-fixed-dim: "#c6c7c4"
  on-primary-fixed: "#1a1c1b"
  on-primary-fixed-variant: "#454746"
  secondary-fixed: "#bbeed5"
  secondary-fixed-dim: "#9fd1ba"
  on-secondary-fixed: "#002116"
  on-secondary-fixed-variant: "#1f4f3d"
  tertiary-fixed: "#e3e2e0"
  tertiary-fixed-dim: "#c7c6c5"
  on-tertiary-fixed: "#1a1c1b"
  on-tertiary-fixed-variant: "#464746"
  background: "#111413"
  on-background: "#e2e3e0"
  surface-variant: "#333534"
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: "600"
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: "500"
    lineHeight: 40px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: "500"
    lineHeight: 32px
  title-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: "600"
    lineHeight: 24px
    letterSpacing: 0.05em
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 26px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 22px
  label-caps:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: "700"
    lineHeight: 16px
    letterSpacing: 0.1em
  data-mono:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-lg: 48px
  stack-md: 24px
  stack-sm: 12px
---

## Brand & Style

The design system is anchored in "Quiet Luxury"—a philosophy of restraint, high-quality materials, and intentionality. It targets high-net-worth individuals and professional institutions who value discretion and sophistication over flashy interfaces. The aesthetic moves away from the aggressive, data-heavy "Bloomberg" look toward a serene, editorial experience that feels more like a private banking lounge than a trading floor.

The visual style blends **Minimalism** with **Glassmorphism**. It utilizes expansive white space to denote "digital real estate value," allowing critical financial data to breathe. Sophistication is achieved through a meticulous balance of razor-thin borders, subtle translucency, and high-contrast typography that mirrors luxury publishing. The emotional response should be one of absolute security, calm authority, and exclusive access.

## Colors

The palette is restricted to a triad of prestige tones.

- **Primary (Deep Charcoal):** Used for the core "void" of the interface. This is not a flat black, but a deep, textured obsidian that provides the foundation for depth.
- **Secondary (Refined Emerald):** A low-saturation, jewel-toned green used sparingly for success states, primary actions, and "growth" indicators. It signifies wealth and stability without being garish.
- **Tertiary (Off-White/Parchment):** Used for primary text and high-contrast surfaces. It reduces eye strain compared to pure white and adds a paper-like, tactile quality to the typography.
- **Neutral:** Mid-tone greys with slight olive undertones are used for borders, secondary labels, and inactive states to maintain the organic, sophisticated feel.

## Typography

Typography in this design system is used as a primary decorative element.

**Playfair Display** is reserved for high-level narrative moments: headlines, portfolio totals, and section headers. It should always be set with slightly tightened letter-spacing to maintain a bespoke, "locked" appearance.

**Manrope** provides a functional counterpoint. Its clean, geometric construction ensures that complex financial figures and UI labels remain legible. For data-heavy tables, use the `data-mono` style which utilizes Manrope's tabular figures to ensure numbers align vertically for easy comparison. Use `label-caps` for overlines and small metadata to inject a sense of architectural structure.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to ensure a controlled, gallery-like presentation of financial data. Content is centered within a 1440px container with generous 64px outer margins.

The spacing rhythm is intentionally "loose." Where standard SaaS apps might use 16px of padding, this design system uses 24px or 32px to signal luxury.

- **Desktop:** 12-column grid with wide 24px gutters.
- **Mobile:** 4-column grid. Large headlines scale down significantly to avoid awkward line breaks, and margins tighten to 20px to maximize the utility of the smaller viewport.
- **Alignment:** All elements should align to a strictly enforced 8px baseline grid to maintain the "professional depth" and structural integrity required for financial trust.

## Elevation & Depth

Depth is communicated through **Glassmorphism** and **Tonal Layering** rather than traditional drop shadows.

1.  **Base Layer:** The Deep Charcoal (#0F1110) background.
2.  **Surface Layer:** Semi-transparent surfaces (Opacity 40-60%) with a 20px backdrop-blur. This creates a "smoked glass" effect that allows background colors or charts to peek through.
3.  **Outlines:** Instead of heavy shadows, use 1px solid borders in a slightly lighter charcoal or a very faint Emerald tint (10% opacity). This creates "ghost borders" that define shape through light rather than weight.
4.  **Interactive Depth:** Upon hover, an element's backdrop-blur should increase, and its border-opacity should double. Avoid "lifting" elements toward the user; instead, let them become more "luminous."

## Shapes

The shape language is disciplined and architectural. A "Soft" (`1`) roundedness is applied to all UI components to prevent the interface from feeling sharp or aggressive, while maintaining the precision of a professional financial tool.

- **Standard Elements (Buttons, Inputs):** 4px (0.25rem) corner radius.
- **Large Containers (Cards, Modals):** 8px (0.5rem) corner radius.
- **Emerald Accents:** Small markers or status dots remain perfectly circular to act as "gems" within the structured grid.

## Components

- **Buttons:** Primary buttons use a solid Refined Emerald fill with Off-White text. Secondary buttons use a "Ghost" style: a 1px border of the Tertiary color with no fill. All buttons should have a minimum width to ensure the elegant typography has space.
- **Inputs:** Fields are defined only by a bottom border (1px Tertiary at 30% opacity) until focused, at which point the border glows with a subtle Emerald tint. This mimics high-end stationery.
- **Cards:** Use the glassmorphic style described in Elevation. No shadows; only a 1px border. Card headers should use `label-caps` for the category and `headline-sm` for the primary value.
- **Chips/Badges:** Small, rectangular with a 2px radius. Use a 10% Emerald fill for positive indicators and a 10% Grey fill for neutral ones. Text must be in `label-caps`.
- **Data Visualizations:** Charts should use thin lines (1.5pt) and avoid area fills unless using a very subtle gradient that fades into the Deep Charcoal background. The Emerald accent is the primary color for the most important data line.
- **Lists:** Transaction lists should have generous vertical padding (16px) and be separated by 1px dividers that do not span the full width of the container, creating a "floating" look.

---
name: Obsidian & Emerald
colors:
  surface: "#111413"
  surface-dim: "#111413"
  surface-bright: "#373a38"
  surface-container-lowest: "#0c0f0d"
  surface-container-low: "#1a1c1b"
  surface-container: "#1a1c1b"
  surface-container-high: "#282a29"
  surface-container-highest: "#333534"
  on-surface: "#e2e3e0"
  on-surface-variant: "#c4c7c4"
  inverse-surface: "#e2e3e0"
  inverse-on-surface: "#2f312f"
  outline: "#8e928f"
  outline-variant: "#444845"
  surface-tint: "#9fd1ba"
  primary: "#9fd1ba"
  on-primary: "#023828"
  primary-container: "#1f4f3d"
  on-primary-container: "#8ec0a9"
  inverse-primary: "#1f4f3d"
  secondary: "#1a1c1b"
  on-secondary: "#c4c7c4"
  secondary-container: "#1a1c1b"
  on-secondary-container: "#c4c7c4"
  tertiary: "#9fd1ba"
  on-tertiary: "#023828"
  tertiary-container: "#1f4f3d"
  on-tertiary-container: "#8ec0a9"
  error: "#c97b84"
  on-error: "#3f1014"
  error-container: "#7c3a43"
  on-error-container: "#ffdcdb"
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
    fontSize: clamp(40px, 5vw, 64px)
    fontWeight: "600"
    lineHeight: 1.05
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Playfair Display
    fontSize: clamp(28px, 3vw, 40px)
    fontWeight: "500"
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Playfair Display
    fontSize: clamp(22px, 2vw, 28px)
    fontWeight: "500"
    lineHeight: 1.2
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: "600"
    lineHeight: 24px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 1.65
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 1.6
  label-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.08em
  data-mono:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  2xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-xl: 80px
  margin-mobile: 20px
  stack-lg: 48px
  stack-md: 24px
  stack-sm: 12px
---

## Brand & Style

The design system is anchored in "Quiet Luxury"—a philosophy of restraint, high-quality materials, and intentionality. It targets high-net-worth individuals and professional institutions who value discretion and sophistication over flashy interfaces. The aesthetic moves away from the aggressive, data-heavy "Bloomberg" look toward a serene, editorial experience that feels more like a private banking lounge than a trading floor.

The visual style blends **Minimalism** with **Glassmorphism** and a touch of analog texture. It utilizes expansive white space to denote "digital real estate value," allowing critical financial data to breathe. Sophistication is achieved through a meticulous balance of razor-thin borders, subtle translucency, tinted shadows, and high-contrast typography that mirrors luxury publishing. A fixed grain overlay breaks digital flatness and adds the tactility of fine paper.

## Colors

The palette is restricted to a triad of prestige tones.

- **Primary (Refined Emerald):** A low-saturation, jewel-toned green (`#9fd1ba` in dark mode, `#1f4f3d` in light mode) used for primary actions, active navigation, income indicators, and growth signals. It signifies wealth and stability without being garish.
- **Surface (Deep Obsidian / Soft Parchment):** The core "void" of the interface is a deep, textured obsidian (`#111413`) in dark mode and a soft luxury parchment (`#fcfbf9`) in light mode. This is not a flat black or sterile white; it provides the foundation for depth and warmth.
- **Text (Off-White/Parchment on Dark, Deep Obsidian on Light):** Primary text uses `on-surface` colors that reduce eye strain compared to pure white or black and add a paper-like, tactile quality.
- **Destructive (Muted Rose):** A desaturated burgundy-rose (`#c97b84`) for errors and destructive actions. It communicates urgency without the harshness of pure red.
- **Neutral:** Mid-tone greys with slight olive undertones are used for borders, secondary labels, and inactive states to maintain the organic, sophisticated feel.

Light mode inverts the relationship: the emerald deepens to `#1f4f3d` for buttons and emphasis, while surfaces shift to warm parchment tones. Both modes share the same shadow tint derived from the primary emerald hue.

## Typography

Typography in this design system is used as a primary decorative element.

**Playfair Display** is reserved for high-level narrative moments: headlines, portfolio totals, and section headers. Display type is set large, with slightly tightened letter-spacing and balanced text wrapping to maintain a bespoke, "locked" appearance.

**Geist** provides a functional, modern counterpoint. Its clean construction and variable weight axis ensure that UI labels, body copy, and navigation remain crisp. For data-heavy tables and financial figures, use the `data-mono` style with **Geist Mono** and `tabular-nums` to keep numbers aligned vertically for easy comparison.

`label-caps` is used sparingly for overlines and small metadata. It uses uppercase with wide tracking to inject architectural structure, but should not be used for card descriptions or paragraph labels where sentence case is more readable.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to ensure a controlled, gallery-like presentation of financial data. Content is centered within a 1440px container with generous outer margins (64px on desktop, scaling to 80px on very wide screens, and 20px on mobile).

The spacing rhythm is intentionally "loose." Where standard SaaS apps might use 16px of padding, this design system uses 24px or 32px to signal luxury. Dashboard pages use a consistent vertical stack rhythm (`stack-lg: 48px`, `stack-md: 24px`) between sections.

- **Desktop:** 12-column grid with wide 24px gutters.
- **Mobile:** 4-column grid. Large headlines scale down significantly to avoid awkward line breaks, and margins tighten to 20px to maximize the utility of the smaller viewport.
- **Alignment:** All elements should align to a strictly enforced 8px baseline grid to maintain the "professional depth" and structural integrity required for financial trust.
- **Accessibility:** A hidden skip-to-content link is provided for keyboard users, and visible focus rings are required on all interactive elements.

## Elevation & Depth

Depth is communicated through **Glassmorphism**, **Tonal Layering**, and **Texture** rather than generic black shadows.

1. **Base Layer:** The Deep Obsidian (`#111413`) or Soft Parchment (`#fcfbf9`) background.
2. **Surface Layer:** Semi-transparent surfaces (opacity 40–60%) with a 20px backdrop-blur. This creates a "smoked glass" effect that allows background colors or charts to peek through.
3. **Texture Layer:** A fixed, pointer-events-none grain overlay at very low opacity (4% dark, 2.5% light) adds subtle analog texture across the entire interface.
4. **Outlines:** Instead of heavy shadows, use 1px solid borders in a slightly lighter charcoal or a very faint Emerald tint (10% opacity). This creates "ghost borders" that define shape through light rather than weight.
5. **Shadows:** When shadows are used, they are tinted with the primary emerald hue (`shadow-tint`, `shadow-tint-lg`) rather than pure black, so they blend with the palette.
6. **Interactive Depth:** Upon hover, an element's backdrop-blur should increase, and its border-opacity should double. Cards may also lift slightly (`translateY(-1px)`). Avoid aggressive "lifting" effects; instead, let elements become more luminous.

## Shapes

The shape language is disciplined and architectural. A "Soft" roundedness is applied to all UI components to prevent the interface from feeling sharp or aggressive, while maintaining the precision of a professional financial tool.

- **Small Elements (Badges, Markers):** 2px corner radius.
- **Standard Elements (Buttons, Inputs):** 4px (0.25rem) corner radius.
- **Medium Containers (Cards, Panels):** 12px (0.75rem) corner radius.
- **Large Containers (Modals, Hero Cards):** 16px–24px (1rem–1.5rem) corner radius.
- **Icon Containers:** Prefer squircles (rounded rectangles) over perfect circles for a less generic look. Small status dots remain circular to act as "gems" within the structured grid.

## Components

- **Buttons:** Primary buttons use a solid Refined Emerald fill with Off-White text. Secondary buttons use a "Ghost" style: a 1px border with no fill. All buttons have a minimum width, a visible focus ring, and an active pressed state (`scale(0.98)`).
- **Inputs:** Fields are defined only by a bottom border (1px Tertiary at 30% opacity) until focused, at which point the border glows with a subtle Emerald tint. This mimics high-end stationery.
- **Cards:** Use the glassmorphic style described in Elevation, with a tinted shadow and a 1px border. Cards are rounded-xl by default. Card descriptions should be sentence case in a small, medium-weight font — not all-caps.
- **Chips/Badges:** Small, rectangular with a 2px radius. Use a 10% Emerald fill for positive indicators and a 10% Grey fill for neutral ones. Text may use `label-caps` for status badges.
- **Data Visualizations:** Charts use a monochromatic emerald scale rather than a rainbow palette. Lines are thin (1.5pt) and area fills, when used, fade into the background. The Emerald accent is reserved for the most important data series.
- **Lists:** Transaction lists should have generous vertical padding (16px) and be separated by subtle dividers. Empty states are composed with an icon, helpful copy, and a clear call to action rather than a bare message.
- **Navigation:** The desktop sidebar is a narrow glass panel with active-state emerald highlights. The mobile bottom bar uses the same tint system. The footer is minimal, focusing on main paths and legally required links (Privacy, Terms).

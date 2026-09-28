---
name: Obsidian & Emerald
colors:
  background: "#0a0d0c"
  sidebar: "#0e1311"
  workspace: "#121715"
  card: "#181e1b"
  surface: "#181e1b"
  surface-dim: "#0e1311"
  surface-bright: "#373a38"
  surface-container-lowest: "#0a0d0c"
  surface-container-low: "#0e1311"
  surface-container: "#121715"
  surface-container-high: "#181e1b"
  surface-container-highest: "#222a26"
  on-surface: "#e6e9e6"
  on-surface-variant: "#c8cec8"
  inverse-surface: "#e6e9e6"
  inverse-on-surface: "#1c221e"
  outline: "#8c938f"
  outline-variant: "#444845"
  surface-tint: "#9fd1ba"
  primary: "#9fd1ba"
  on-primary: "#022b1f"
  primary-container: "#19382b"
  on-primary-container: "#b2e4ce"
  inverse-primary: "#194a37"
  secondary: "#1e2622"
  on-secondary: "#c8cec8"
  secondary-container: "#1e2622"
  on-secondary-container: "#c8cec8"
  tertiary: "#9fd1ba"
  on-tertiary: "#022b1f"
  tertiary-container: "#19382b"
  on-tertiary-container: "#b2e4ce"
  error: "#d47e88"
  on-error: "#380d12"
  error-container: "#7c3a43"
  on-error-container: "#ffdcdb"
  border: "rgba(255, 255, 255, 0.10)"
  border-subtle: "rgba(255, 255, 255, 0.05)"
  border-strong: "rgba(255, 255, 255, 0.18)"
  border-accent: "rgba(159, 209, 186, 0.35)"
  message-bubble-border: "rgba(255, 255, 255, 0.14)"
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

- **Primary (Refined Emerald):** A low-saturation, jewel-toned green (`#9fd1ba` in dark mode, `#194a37` in light mode) used for primary actions, active navigation, income indicators, and growth signals. It signifies wealth and stability without being garish.
- **Base Canvas (Deep Obsidian / Soft Stone):** The core desk/foundation layer is a deep, textured obsidian (`#0a0d0c`) in dark mode and a crisp, soft stone (`#f0f2ef`) in light mode.
- **Workspace Surface (Charcoal / Pure White):** The active work canvas is elevated above the base canvas (`#121715` in dark mode, `#ffffff` in light mode).
- **Elevated Cards & Modules:** Solid surfaces (`#181e1b` in dark mode, `#ffffff` in light mode) with top inner highlights and crisp perimeter borders.
- **Semantic Borders:** Explicit contrast boundaries without compounding opacity (`border-subtle` at 5%, `border` at 10%, `border-strong` at 18%, `border-accent` at 35%).
- **Theme-Adaptive Borders:** AI chat response bubbles use `--message-bubble-border`, which renders a crisp hairline (`rgba(255, 255, 255, 0.14)`) in dark mode to separate from the dark canvas, and `transparent` in light mode to prevent unsightly white halos.
- **Destructive (Muted Rose):** A desaturated burgundy-rose (`#d47e88`) for errors and destructive actions.

Light mode inverts the luminance scale: the emerald deepens to `#194a37` for buttons and emphasis, while surfaces shift to pure white cards floating on a soft neutral stone background.
## Typography

Typography in this design system is used as a primary decorative element.

**Playfair Display** is reserved for high-level narrative moments: headlines, portfolio totals, and section headers. Display type is set large, with slightly tightened letter-spacing and balanced text wrapping to maintain a bespoke, "locked" appearance.

**Geist** provides a functional, modern counterpoint. Its clean construction and variable weight axis ensure that UI labels, body copy, and navigation remain crisp. For data-heavy tables and financial figures, use the `data-mono` style with **Geist Mono** and `tabular-nums` to keep numbers aligned vertically for easy comparison.

`label-caps` is used sparingly for overlines and small metadata. It uses uppercase with wide tracking to inject architectural structure, but should not be used for card descriptions or paragraph labels where sentence case is more readable.

## Layout & Spacing

The layout follows an **Inset Studio Frame** philosophy on desktop:
- **Desktop Shell:** The outer window is a continuous base canvas with uniform $8\text{px}$ perimeter spacing (`lg:p-2 lg:gap-2`).
- **Sidebar Rail:** The desktop sidebar rests borderless directly on the canvas (`bg-transparent border-r-0`), eliminating dual-border visual clutter. Navigation links float on the desk with subtle active pills and accent marker tabs.
- **Floating Workspace Canvas:** The main application view sits inside an inset container with rounded corners and a hairline perimeter border (`lg:rounded-2xl lg:border lg:border-border bg-workspace shadow-sm`). The footer is enclosed neatly at the base of this card.
- **Mobile Floating Dock:** Mobile navigation floats as a centered dock capsule (`rounded-full border border-border bg-card/95 backdrop-blur-2xl shadow-2xl`).
- **Landing Floating Island Nav:** The marketing site features a detached pill navbar (`max-w-4xl mx-auto rounded-full border border-border bg-card/85 backdrop-blur-xl shadow-lg`) with an integrated theme toggle and clean 28px native app icon.
- **Landing Mobile Device Preview:** The hero product preview renders as a smartphone device chassis with dynamic island, status bar, and home swipe indicator.
- **Accessibility:** A hidden skip-to-content link is provided for keyboard users, and visible focus rings are required on all interactive elements.
## Elevation & Depth

Depth is communicated through a disciplined **4-Tier Elevation System**, **Inner Highlights**, and **Semantic Borders** rather than flat vectors or heavy drop shadows:

1. **Level 0 (Base Canvas):** Deep Obsidian (`#0a0d0c`) or Soft Stone (`#f0f2ef`) desk base.
2. **Level 1 (Sidebar Rail):** Borderless rail (`#0e1311` dark, `#e7eae5` light) resting on the canvas.
3. **Level 2 (Workspace Canvas):** Dedicated inset work surface (`#121715` dark, `#ffffff` light) with rounded corners.
4. **Level 3 (Elevated Cards & Dialogs):** Solid elevated surfaces (`#181e1b` dark, `#ffffff` light) with a 1px top highlight (`card-inner-highlight`) and crisp semantic border (`border border-border`).
5. **Semantic Outlines:** Clear borders without compounding alpha multipliers (`border` at 10% white in dark / 9% black in light; `border-strong` at 18%).
6. **Shadows:** Soft ambient shadows (`shadow-sm`, `shadow-md`, `shadow-2xl`) with primary emerald tinting (`shadow-tint`).
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
- **Cards:** Solid elevated cards with a 1px border (`border-border`), subtle top highlight (`card-inner-highlight`), and hover micro-interaction (`hover:-translate-y-0.5 hover:shadow-md`). Cards avoid continuous GPU backdrop-blur repaints.
- **Chips/Badges:** High-contrast capsules with solid or tinted fills and matching hairline borders (`border-primary/25`, `border-border/30`).
- **Chat Bubbles:** User messages use an emerald-tinted accent capsule (`bg-accent text-accent-foreground border border-primary/25`). AI messages use `ai-message-gradient` with a theme-adaptive border (`rgba(255, 255, 255, 0.14)` in dark mode, `transparent` in light mode).
- **Data Visualizations:** Charts use a monochromatic emerald scale rather than a rainbow palette. Lines are thin (1.5pt) and area fills fade into the card background.
- **Navigation:** Desktop sidebar is a borderless rail with active indicator tabs (`[&.active]:bg-primary/12 [&.active]:text-primary`). Mobile dock floats as a centered rounded capsule.

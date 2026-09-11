# Cuan Landing Page (`landing`)

The marketing and landing page for **Cuan**, built with [Astro](https://astro.build).

Live Site: [cuan.fiqri.dev](https://cuan.fiqri.dev)

## 🚀 Tech Stack

- **Framework**: [Astro](https://astro.build)
- **UI & Styling**: [React](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), and the shared `@cuan/ui` workspace package
- **Internationalization (i18n)**: Native Astro i18n support (Indonesian `id` default, English `en`)
- **Analytics & Performance**: [Vercel Analytics](https://vercel.com/docs/analytics) & [Speed Insights](https://vercel.com/docs/speed-insights)

## 📁 Directory Structure

```text
landing/
├── public/          # Static assets (images, icons)
├── scripts/         # Utility scripts
├── src/
│   ├── i18n/        # Translation maps (translations.ts)
│   ├── layouts/     # Global Astro layouts (Base.astro)
│   ├── pages/       # Astro pages (index, terms, privacy, plus /en routes)
│   ├── partials/    # Reusable Astro content sections (Hero, Features, CTA, etc.)
│   └── styles/      # Global CSS imports
├── astro.config.mjs # Astro and Vite configuration
├── moon.yml         # Moonrepo task configuration
└── package.json     # Project dependencies
```

## 🛠️ Commands

This project is part of a Moonrepo workspace. You can run tasks from the root or inside the `landing` directory:

| Command | Moon Command | Description |
| --- | --- | --- |
| `bun run dev` | `moon landing:dev` | Starts the Astro development server at `localhost:4321`. |
| `bun run build` | `moon landing:build` | Builds the static site to the `dist/` directory. |
| `bun run preview` | `moon landing:preview` | Previews the production build locally. |

## 🔗 Shared Dependencies

This app consumes the `@cuan/ui` workspace package for design tokens and reusable UI components. Changes to the UI package will instantly reflect here during development.

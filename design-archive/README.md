# Design Archive

This directory contains the original design prototypes and visual assets for the Apeks LMS platform.

## Contents

| File | Description |
|------|-------------|
| `Apeks LMS.html` | Main interactive prototype (open in browser) |
| `Apeks LMS v1.html` | Earlier version of the prototype |
| `apeks-components.jsx` | Reusable UI components: design tokens, StarField, MilkyWayBand, ConstellationSVG, ProgressRing, Icon, Btn, Badge, Sidebar, LMSLayout |
| `apeks-components-v1.jsx` | Earlier version of components |
| `apeks-lms-pages.jsx` | LMS page compositions: Dashboard, Course, Lesson, Homework, Calendar, Trainer |
| `apeks-lms-pages-v1.jsx` | Earlier version of page compositions |
| `apeks-landing.jsx` | Landing page design prototype |
| `apeks-landing-v1.jsx` | Earlier version of landing page |
| `boitsov-avatar.png` | Avatar image for the instructor |
| `uploads/` | Reference screenshots and images from Skillspace |

## Design System

### Color Palette (Dark Theme)
- Background: `#070C18`
- Surfaces: `#0D1525`, `#152035`, `#1E2D4A`
- Text: `#F0EDE8` (primary), `#A8A5A0` (secondary), `#6A6860` (muted)
- Gold accent: `#D9A441`
- Cyan accent: `#4ECDD4`
- Purple accent: `#8B6DD4`

### Color Palette (Light Theme)
- Background: `#FAF8F4`
- Surfaces: `#F5F2ED`, `#EAE5DC`, `#D5CFC2`
- Text: `#26241F` (primary), `#5C5A52` (secondary), `#8E8B82` (muted)
- Gold accent: `#C48A25`
- Cyan accent: `#1A8F96`

### Fonts
- **Newsreader** (serif) — logo, headings
- **Inter** (sans-serif) — body text, UI elements

## How to Use

1. Open `Apeks LMS.html` in a browser to view the interactive prototype
2. Design tokens have been extracted to `frontend/src/lib/design-tokens.ts`
3. When applying the design to the production frontend, reference the component styles in `apeks-components.jsx` and page layouts in `apeks-lms-pages.jsx`

## Integration Notes

The production frontend (`frontend/`) is built with Next.js + Tailwind CSS. To apply this design:

1. Update `tailwind.config.ts` with the color tokens from `design-tokens.ts`
2. Add Google Fonts (Newsreader, Inter) to the root layout
3. Apply the dark theme background and surface colors to the layout components
4. Use the StarField/ConstellationSVG as decorative elements in the sidebar

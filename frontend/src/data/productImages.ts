/**
 * Photography available to product records.
 *
 * These files live in `public/assets`, which Vite serves verbatim rather than
 * processing, so they cannot be enumerated with import.meta.glob and the
 * backend cannot see them either — the API and the images are deployed to
 * different origins. Hence a hand-kept list.
 *
 * If it drifts from the directory nothing breaks: the picker is a shortcut,
 * and the admin form still accepts a typed path for anything not listed here.
 *
 * Brand assets (logo.png, icon-*.png) are deliberately excluded — they are
 * chrome, not product photography.
 */
export const PRODUCT_IMAGES = [
  '/assets/led-wall.jpg',
  '/assets/lighting.jpg',
  '/assets/sound.jpg',
  '/assets/catalogue.jpg',
  '/assets/tagline.jpg',
  '/assets/one-partner.jpg',
  '/assets/direct.jpg',
  '/assets/made-order.jpg',
  '/assets/meet.jpg',
  '/assets/hero-stage.jpg',
  '/assets/hero-wide.jpg',
] as const

/**
 * Photography available to product records.
 *
 * These are stand-ins, not SLS's own goods: licensed Wikimedia Commons
 * photographs of the same kinds of equipment, credited in the footer and
 * listed in PLAN-taste.md / REPORT-taste.md with the shot that replaces
 * each. The files they replaced were AI-made stage renders, which is why
 * every product used to look like the same blue concert.
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
  '/assets/shots/photo-f167000710-960.jpg',
  '/assets/shots/photo-f39317346-960.jpg',
  '/assets/shots/photo-f7751364-960.jpg',
  '/assets/shots/photo-f2162506-960.jpg',
  '/assets/shots/photo-f116189302-960.jpg',
  '/assets/shots/photo-f181466405-960.jpg',
] as const

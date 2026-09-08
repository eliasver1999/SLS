import routes from './routeSeo.json'

/**
 * Search and share copy for the public routes.
 *
 * The copy itself lives in routeSeo.json, not here, for one reason: the
 * build-time pre-render (scripts/prerender.mjs) reads the same file from
 * plain Node, so a shared link and a crawled page cannot disagree. JSON is
 * the one format both a bundler and a build script read without ceremony.
 *
 * Descriptions are ~150 characters — long enough to say something, short
 * enough that Google shows all of it. English only: a crawler is served one
 * language, and English is the wider net for equipment enquiries.
 *
 * Adding a public route means adding it here. A route that is missing is
 * treated as a signed-in screen and marked noindex, which is the safe way
 * for this to fail.
 */
export type RouteSeo = {
  path: string
  /** Page title without the site name — " — SLS" is appended. Empty for home. */
  title: string
  description: string
  image?: string
  /** Relative weight in the sitemap, and how often it is worth recrawling. */
  priority: number
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

export const ROUTE_SEO: RouteSeo[] = routes as RouteSeo[]

export function seoFor(path: string): RouteSeo | undefined {
  return ROUTE_SEO.find((route) => route.path === path)
}

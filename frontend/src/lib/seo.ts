import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLang } from '../context/language'

/**
 * Per-page titles, descriptions and share cards.
 *
 * Every route used to serve the same title and description, so Google saw
 * one page and a link shared in WhatsApp said "SLS — Sound. Lights.
 * Screens." whether it pointed at the catalogue or a single LED panel.
 *
 * Google renders JavaScript, so setting these here is enough for search.
 * Social scrapers do not, which is why the static routes are also
 * pre-rendered at build time (see scripts/prerender.mjs) — this hook and
 * that script read the same copy so the two cannot drift.
 */

/**
 * The site's public origin, used for canonical and og:url. Falls back to
 * wherever the app is actually being served from, so a preview deployment
 * never claims to be the canonical copy of the production site.
 */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || (typeof window === 'undefined' ? '' : window.location.origin)
).replace(/\/$/, '')

const DEFAULT_IMAGE = '/assets/hero-wide.jpg'

export type Seo = {
  /** Page title, without the site name — that is appended. */
  title: string
  description: string
  /** Absolute path to a share image, e.g. "/assets/led-wall.jpg". */
  image?: string
  /** Keep this page out of search results (account and admin screens). */
  noindex?: boolean
}

/** Upsert one <meta>, matched by name or property. */
function meta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let tag = document.head.querySelector<HTMLMetaElement>(selector)

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }

  tag.content = content
}

function link(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (!tag) {
    tag = document.createElement('link')
    tag.rel = rel
    document.head.appendChild(tag)
  }

  tag.href = href
}

export function pageTitle(title: string) {
  return title === '' ? 'SLS — Sound. Lights. Screens.' : `${title} — SLS`
}

export function useSeo({ title, description, image = DEFAULT_IMAGE, noindex = false }: Seo) {
  const { pathname } = useLocation()
  const { lang } = useLang()

  useEffect(() => {
    const url = `${SITE_URL}${pathname}`
    const absoluteImage = image.startsWith('http') ? image : `${SITE_URL}${image}`
    const full = pageTitle(title)

    document.title = full
    meta('name', 'description', description)
    link('canonical', url)

    // Search engines: account screens hold nothing a stranger should find,
    // and indexing them wastes crawl budget on pages that need a session.
    meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')

    meta('property', 'og:title', full)
    meta('property', 'og:description', description)
    meta('property', 'og:url', url)
    meta('property', 'og:image', absoluteImage)
    meta('property', 'og:type', 'website')
    meta('property', 'og:site_name', 'SLS')
    meta('property', 'og:locale', lang === 'el' ? 'el_GR' : 'en_GB')

    meta('name', 'twitter:card', 'summary_large_image')
    meta('name', 'twitter:title', full)
    meta('name', 'twitter:description', description)
    meta('name', 'twitter:image', absoluteImage)
  }, [title, description, image, noindex, pathname, lang])
}

const SCHEMA_ID = 'sls-product-schema'

/**
 * Structured data for a product page, so search results can show it as a
 * product rather than as an anonymous page.
 *
 * Deliberately carries no price. Trade pricing is gated behind approval, and
 * putting a number here would publish it to a crawler for the one visitor
 * who is allowed to see it — the gate is worth more than the rich result.
 */
export function useProductSchema(
  product: { name: string; blurb: { en: string; el: string }; image: string; category: string } | undefined,
) {
  useEffect(() => {
    const existing = document.getElementById(SCHEMA_ID)
    existing?.remove()

    if (!product) return

    const tag = document.createElement('script')
    tag.id = SCHEMA_ID
    tag.type = 'application/ld+json'
    tag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.blurb.en,
      image: `${SITE_URL}${product.image}`,
      category: product.category,
      brand: { '@type': 'Brand', name: 'SLS' },
    })
    document.head.appendChild(tag)

    return () => tag.remove()
  }, [product])
}

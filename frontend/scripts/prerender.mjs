/**
 * Post-build step: give crawlers and social scrapers real HTML.
 *
 * The app sets its titles and share tags at runtime, which is enough for
 * Google (it executes JavaScript) and useless for everything else. Facebook,
 * WhatsApp, LinkedIn, Slack and iMessage read the served bytes and never run
 * a script, so a link to /catalogue used to unfurl with the home page's
 * title no matter where it pointed.
 *
 * So each public route gets its own index.html with the tags already in it.
 * Vercel checks the filesystem before applying the SPA rewrite, meaning
 * /catalogue/index.html is served for /catalogue while the client-side
 * router still owns every other path.
 *
 * Also writes sitemap.xml and fills in the Sitemap: line in robots.txt.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, '..', 'dist')
const routes = JSON.parse(readFileSync(join(here, '..', 'src', 'data', 'routeSeo.json'), 'utf8'))

// The public origin. Without it, canonical and og:image cannot be absolute,
// and Facebook rejects a relative og:image outright — so say so loudly
// rather than shipping cards that silently do not render.
const site = (process.env.VITE_SITE_URL || '').replace(/\/$/, '')

if (!site) {
  console.warn(
    '\n  prerender: VITE_SITE_URL is not set.\n' +
      '  Per-route HTML is still written, but og:image and canonical stay relative,\n' +
      '  which most social scrapers will not resolve. Set it to the public origin\n' +
      '  (e.g. https://sls.gr) in the Vercel project environment.\n',
  )
}

const title = (route) =>
  route.title === '' ? 'SLS — Sound. Lights. Screens.' : `${route.title} — SLS`

const absolute = (path) => (site ? `${site}${path}` : path)

/**
 * Escape a value going into an HTML attribute or text node.
 *
 * Product names and blurbs come from the database, so an admin writing a
 * quotation mark would otherwise end the attribute early — breaking the tag
 * at best, and injecting markup into every crawler's view of the page at
 * worst. Titles are text nodes and blurbs are attributes; escaping both the
 * same way costs nothing.
 */
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Replace a tag's content if present, otherwise insert it before </head>. */
function upsert(html, matcher, tag) {
  return matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `  ${tag}\n</head>`)
}

function render(template, route) {
  const url = escapeHtml(absolute(route.path))
  const image = escapeHtml(absolute(route.image ?? '/assets/hero-wide.jpg'))
  const heading = escapeHtml(title(route))
  const description = escapeHtml(route.description)
  let html = template

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${heading}</title>`)
  html = upsert(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${description}" />`,
  )
  html = upsert(html, /<link\s+rel="canonical"[^>]*\/>/, `<link rel="canonical" href="${url}" />`)
  // The Organization block ships with a relative logo; a crawler needs it
  // absolute to fetch it at all.
  html = html.replace('"logo": "/assets/logo.png"', `"logo": "${absolute('/assets/logo.png')}"`)

  const tags = [
    ['og:title', heading],
    ['og:description', description],
    ['og:url', url],
    ['og:image', image],
  ]

  for (const [property, content] of tags) {
    html = upsert(
      html,
      new RegExp(`<meta\\s+property="${property}"[^>]*/>`),
      `<meta property="${property}" content="${content}" />`,
    )
  }

  for (const [name, content] of [
    ['twitter:title', heading],
    ['twitter:description', description],
    ['twitter:image', image],
  ]) {
    html = upsert(
      html,
      new RegExp(`<meta\\s+name="${name}"[^>]*/>`),
      `<meta name="${name}" content="${content}" />`,
    )
  }

  return html
}

/**
 * The catalogue, read from the API at build time.
 *
 * Product pages are the ones that earn search traffic, and their copy lives
 * in the database rather than in this repository — an admin can add a panel
 * without a deploy. Fetching here means a new product gets a real page and a
 * real share card on the next build, with no list to hand-maintain.
 *
 * Non-fatal by design: if the API is unreachable the build still succeeds
 * and product links fall back to the site-wide card. A missing share image
 * is not worth failing a release over.
 */
async function fetchProducts() {
  const api = (process.env.VITE_API_URL || '').replace(/\/$/, '')

  if (!api) {
    console.warn('  prerender: VITE_API_URL not set — skipping product pages.')
    return []
  }

  const products = []

  try {
    for (let page = 1; page <= 20; page += 1) {
      const response = await fetch(`${api}/products?page=${page}`, {
        signal: AbortSignal.timeout(10_000),
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const body = await response.json()
      products.push(...(body.data ?? []))

      if (page >= (body.meta?.last_page ?? 1)) break
    }
  } catch (error) {
    console.warn(`  prerender: could not read the catalogue (${error.message}) — skipping product pages.`)
    return []
  }

  return products.map((product) => ({
    path: `/product/${product.slug}`,
    title: product.name,
    // The same sentence the page shows, which is also the right length for a
    // search result. Trade pricing is never published here: it is gated
    // behind approval, and a crawler is not approved.
    description: product.blurb?.en ?? '',
    image: product.image,
    priority: 0.8,
    changefreq: 'monthly',
  }))
}

const template = readFileSync(join(dist, 'index.html'), 'utf8')
const products = await fetchProducts()
const pages = [...routes, ...products]
let written = 0

for (const route of pages) {
  const html = render(template, route)

  if (route.path === '/') {
    // The SPA fallback itself: every route the router handles is served this
    // file, so it carries the home page's card.
    writeFileSync(join(dist, 'index.html'), html)
  } else {
    const dir = join(dist, route.path)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), html)
  }

  written += 1
}

const today = new Date().toISOString().slice(0, 10)
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((route) =>
    [
      '  <url>',
      `    <loc>${escapeHtml(absolute(route.path))}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority}</priority>`,
      '  </url>',
    ].join('\n'),
  ),
  '</urlset>',
  '',
].join('\n')

writeFileSync(join(dist, 'sitemap.xml'), sitemap)

const robotsPath = join(dist, 'robots.txt')
if (existsSync(robotsPath)) {
  writeFileSync(
    robotsPath,
    readFileSync(robotsPath, 'utf8').replace('SITEMAP_URL', absolute('/sitemap.xml')),
  )
}

console.log(`  prerender: ${written} pages (${routes.length} static, ${products.length} products), sitemap.xml with ${pages.length} urls`)

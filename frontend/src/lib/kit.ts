/**
 * The taste-skill kit inside a single-page app.
 *
 * The kit's scripts are written for a static page: each one runs itself on
 * DOMContentLoaded and binds to whatever is in the document. A router breaks
 * both halves of that — the markup arrives after the scripts, and it is
 * replaced on every navigation.
 *
 * So the kit is loaded once as plain modules from /kit and driven by hand:
 *
 *   - `system.js` binds the nav sheet, the phone action bar, the forms and
 *     the FAQ. The action bar watches *this* page's hero, so `init()` has to
 *     run again on every navigation. It is not idempotent — `nav()` adds a
 *     listener each time — so Layout remounts the header and the bar per
 *     route: the second binding lands on a new node and the first goes with
 *     the old one.
 *   - `layout.js` measures the hero's headline and the stage. That is route
 *     content, so it runs again on every navigation.
 *   - `moments.js` mounts the page's one or two moments. `__momentsManual`
 *     stops it mounting itself, so the old moment is unmounted and the new
 *     one mounted on each navigation rather than left running on a section
 *     that is no longer in the document.
 */

type SystemModule = { default: { init: () => void } }
type LayoutModule = { default: { init: () => void } }
type MomentsModule = {
  mountAll: (root?: ParentNode) => Promise<unknown>
  unmountAll: (root?: ParentNode) => void
}

declare global {
  interface Window {
    __momentsManual?: boolean
  }
}

let loaded: Promise<{ system: SystemModule; layout: LayoutModule; moments: MomentsModule }> | null =
  null

// The kit lives in /public and is served as plain files, so the bundler must
// not try to resolve these: the URL is built at run time, out of its reach.
const kitUrl = (path: string) => new URL(`/kit/${path}`, document.baseURI).href

function load() {
  if (!loaded) {
    // Set before the module evaluates, or it mounts everything itself.
    window.__momentsManual = true
    loaded = Promise.all([
      import(/* @vite-ignore */ kitUrl('system.js')) as Promise<SystemModule>,
      import(/* @vite-ignore */ kitUrl('layout/layout.js')) as Promise<LayoutModule>,
      import(/* @vite-ignore */ kitUrl('moments/moments.js')) as Promise<MomentsModule>,
    ]).then(([system, layout, moments]) => ({ system, layout, moments }))
  }
  return loaded
}

/**
 * Run after the route's markup is in the document. Safe to call on every
 * navigation; the parts that must not run twice are guarded here.
 */
let enterTimer: ReturnType<typeof setTimeout> | undefined

/** Re-arm the hero's entrance. The head line in index.html sets `m-enter`
 *  before the first paint, and `m-enter-done` 700ms later closes the window
 *  for good — which in a router means every hero after the first one would
 *  arrive already finished. */
function armHeroEntrance() {
  const html = document.documentElement
  clearTimeout(enterTimer)
  html.classList.remove('m-enter-done')
  html.classList.add('m-enter')
  enterTimer = setTimeout(() => html.classList.add('m-enter-done'), 700)
}

export async function runKit() {
  armHeroEntrance()
  const { system, layout, moments } = await load()
  moments.unmountAll()
  system.default.init()
  layout.default.init()
  await moments.mountAll()
}

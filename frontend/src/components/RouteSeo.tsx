import { useLocation } from 'react-router-dom'
import { seoFor, type RouteSeo as Route } from '../data/routeSeo'
import { useSeo } from '../lib/seo'

/**
 * Applies the search and share copy for whichever public route is showing.
 *
 * Mounted once in the layout rather than called from each page: a page added
 * without a title is the normal way this kind of thing rots, so the default
 * is correct and a page only writes code to say something different.
 *
 * Routes whose copy depends on loaded data own their own tags — a product's
 * name is not knowable from the path. Those are listed below and skipped
 * here rather than overridden: two components writing the same tags would
 * race, and which one won would depend on the order React happens to flush
 * effects in. Skipping is the only version of this with one writer.
 */
const OWNED_BY_PAGE = ['/product/']

export default function RouteSeo() {
  const { pathname } = useLocation()

  if (OWNED_BY_PAGE.some((prefix) => pathname.startsWith(prefix))) return null

  return <Apply route={seoFor(pathname)} />
}

function Apply({ route }: { route: Route | undefined }) {
  useSeo({
    title: route?.title ?? '',
    description:
      route?.description ??
      'LED screens, stage lighting and pro audio for events in Greece — supplied, installed and operated by one accountable team.',
    image: route?.image,
    // Anything not in the table is a signed-in screen, a form step or a 404;
    // none of them belong in an index.
    noindex: route === undefined,
  })

  return null
}

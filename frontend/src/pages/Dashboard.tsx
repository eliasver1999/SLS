import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { fetchOrders, type MemberStatus, type Order, type OrderStatus, type OrderType } from '../lib/api'
import { errorMessage } from '../lib/errors'
import {
  Building2,
  CircleAlert,
  FileText,
  Hourglass,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  X,
} from 'lucide-react'

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: 'wait',
  quoted: 'ok',
  confirmed: 'ok',
  in_production: 'blue',
  completed: 'ok',
  cancelled: 'rej',
}

export default function Dashboard() {
  const { t } = useLang()
  const { user, isApproved } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [view, setView] = useState<'all' | OrderType>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Pending members have no orders and the API blocks them — skip the call.
    if (!isApproved) return
    fetchOrders()
      .then((res) => setOrders(res.items))
      .catch((e) =>
        setError(
          errorMessage(e, t('Could not load your requests.', 'Αδυναμία φόρτωσης των αιτημάτων σας.')),
        ),
      )
  }, [isApproved, t])

  const company = user?.company ?? 'Nova Events'
  const firstName = (user?.name ?? 'Maria').split(' ')[0]
  const initials = company
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const kpis = useMemo(() => {
    const openQuotes = orders.filter((o) => o.type === 'quote' && ['pending', 'quoted'].includes(o.status)).length
    const activeOrders = orders.filter((o) => o.type === 'order' && !['completed', 'cancelled'].includes(o.status)).length
    const completed = orders.filter((o) => o.status === 'completed').length
    return { openQuotes, activeOrders, completed }
  }, [orders])

  const visible = useMemo(
    () => (view === 'all' ? orders : orders.filter((o) => o.type === view)),
    [orders, view],
  )

  // Most recently updated order (by last status-history entry) for the panel.
  const latest = useMemo(() => {
    const at = (o: Order) => o.status_history?.[o.status_history.length - 1]?.at ?? o.created_at
    return [...orders].sort((a, b) => (at(a) < at(b) ? 1 : -1))[0] ?? null
  }, [orders])

  // Signed in but awaiting admin approval → explain status, don't show the
  // full partner dashboard (pricing, orders, invoices).
  if (user && !isApproved) {
    return <PendingDashboard status={user.status} />
  }

  const statusLabel = (s: OrderStatus) =>
    ({
      pending: t('Awaiting', 'Σε αναμονή'),
      quoted: t('Quoted', 'Προσφορά'),
      confirmed: t('Confirmed', 'Επιβεβαιωμένο'),
      in_production: t('In production', 'Σε παραγωγή'),
      completed: t('Completed', 'Ολοκληρώθηκε'),
      cancelled: t('Cancelled', 'Ακυρώθηκε'),
    })[s]

  const typeLabel = (o: Order) =>
    ({ quote: t('Quote', 'Προσφορά'), order: t('Order', 'Παραγγελία') })[o.type]

  const itemSummary = (o: Order) =>
    o.items.map((i) => `${i.name}${i.qty ? ` × ${i.qty}` : ''}`).join(', ')

  return (
    <div className="dash">
      <aside className="side">
        <div className="u">
          <div className="av">{initials}</div>
          <div>
            <b style={{ fontSize: 14 }}>{company}</b>
            <div className="muted" style={{ fontSize: 12 }}>
              {t('Approved partner', 'Εγκεκρ. συνεργάτης')}
            </div>
          </div>
        </div>
        <nav>
          <a
            className={view === 'all' ? 'on' : undefined}
            style={{ cursor: 'pointer' }}
            onClick={() => setView('all')}
          >
            <LayoutDashboard size={17} aria-hidden />
            {t('Dashboard', 'Πίνακας')}
          </a>
          <Link to="/catalogue">
            <Package size={17} aria-hidden />
            {t('Catalogue', 'Κατάλογος')}
          </Link>
          <a
            className={view === 'quote' ? 'on' : undefined}
            style={{ cursor: 'pointer' }}
            onClick={() => setView('quote')}
          >
            <FileText size={17} aria-hidden />
            {t('Quotes', 'Προσφορές')}
          </a>
          <a
            className={view === 'order' ? 'on' : undefined}
            style={{ cursor: 'pointer' }}
            onClick={() => setView('order')}
          >
            <ShoppingCart size={17} aria-hidden />
            {t('Orders', 'Παραγγελίες')}
          </a>
          {/* Not built yet — shown as unavailable rather than as a link that
              silently does nothing when clicked. */}
          <a aria-disabled style={{ opacity: 0.45, cursor: 'not-allowed' }}>
            <Receipt size={17} aria-hidden />
            {t('Invoices', 'Τιμολόγια')}
            <span className="status wait" style={{ marginLeft: 'auto' }}>
              {t('Soon', 'Σύντομα')}
            </span>
          </a>
          <a aria-disabled style={{ opacity: 0.45, cursor: 'not-allowed' }}>
            <Building2 size={17} aria-hidden />
            {t('Company profile', 'Προφίλ εταιρείας')}
            <span className="status wait" style={{ marginLeft: 'auto' }}>
              {t('Soon', 'Σύντομα')}
            </span>
          </a>
        </nav>
      </aside>

      <div className="dash-main">
        {/* The sidebar is hidden on narrow screens, so the same views need a
            reachable switcher here. */}
        <nav className="dash-tabs">
          <button className={view === 'all' ? 'on' : undefined} onClick={() => setView('all')}>
            <LayoutDashboard size={15} aria-hidden />
            {t('Dashboard', 'Πίνακας')}
          </button>
          <button className={view === 'quote' ? 'on' : undefined} onClick={() => setView('quote')}>
            <FileText size={15} aria-hidden />
            {t('Quotes', 'Προσφορές')}
          </button>
          <button className={view === 'order' ? 'on' : undefined} onClick={() => setView('order')}>
            <ShoppingCart size={15} aria-hidden />
            {t('Orders', 'Παραγγελίες')}
          </button>
          <Link className="btn btn-ghost btn-sm" to="/catalogue" style={{ flex: 'none' }}>
            <Package size={15} aria-hidden />
            {t('Catalogue', 'Κατάλογος')}
          </Link>
        </nav>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="h2" style={{ fontSize: 26 }}>
              {t('Welcome back, ', 'Καλώς ήρθατε, ')}
              {firstName}
            </h1>
            <p className="muted">
              {t("Here's what's happening with your account.", 'Δείτε τι συμβαίνει στον λογαριασμό σας.')}
            </p>
          </div>
          <Link className="btn btn-primary btn-sm" to="/catalogue">
            {t('Browse catalogue', 'Δείτε κατάλογο')}
          </Link>
        </div>

        <div className="kpis mt24">
          <div className="kpi">
            <div className="n blue">{kpis.openQuotes}</div>
            <div className="l">{t('Open quotes', 'Ανοιχτές προσφορές')}</div>
          </div>
          <div className="kpi">
            <div className="n">{kpis.activeOrders}</div>
            <div className="l">{t('Active orders', 'Ενεργές παραγγελίες')}</div>
          </div>
          <div className="kpi">
            <div className="n" style={{ color: '#48d38a' }}>
              {kpis.completed}
            </div>
            <div className="l">{t('Completed', 'Ολοκληρωμένες')}</div>
          </div>
        </div>

        {error && (
          <div
            className="notice mt24"
            style={{ borderColor: 'rgba(255,86,86,.35)', background: 'rgba(255,86,86,.08)' }}
          >
            <div className="ic" style={{ color: '#ff7a7a' }}>
              <CircleAlert size={18} aria-hidden />
            </div>
            <div>{error}</div>
          </div>
        )}

        <h3 className="head mt40" style={{ fontSize: 15, letterSpacing: 1, color: 'var(--grey)' }}>
          {view === 'quote'
            ? t('YOUR QUOTES', 'ΟΙ ΠΡΟΣΦΟΡΕΣ ΣΑΣ')
            : view === 'order'
              ? t('YOUR ORDERS', 'ΟΙ ΠΑΡΑΓΓΕΛΙΕΣ ΣΑΣ')
              : t('RECENT QUOTES & ORDERS', 'ΠΡΟΣΦΑΤΕΣ ΠΡΟΣΦΟΡΕΣ & ΠΑΡΑΓΓΕΛΙΕΣ')}
        </h3>
        <div className="table-scroll">
          <table className="tbl mt16">
            <tbody>
              <tr>
                <th>#</th>
                <th>{t('Item', 'Είδος')}</th>
                <th>{t('Type', 'Τύπος')}</th>
                <th>{t('Total (ex VAT)', 'Σύνολο (χ/ΦΠΑ)')}</th>
                <th>{t('Status', 'Κατάσταση')}</th>
                <th></th>
              </tr>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    {t('No requests yet — browse the catalogue to get started.', 'Καμία αίτηση ακόμη — δείτε τον κατάλογο.')}
                  </td>
                </tr>
              )}
              {visible.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{o.reference.replace('SLS-', '')}</td>
                  <td>{itemSummary(o)}</td>
                  <td>{typeLabel(o)}</td>
                  <td>{o.total ?? '—'}</td>
                  <td>
                    <span className={`status ${STATUS_STYLE[o.status]}`}>{statusLabel(o.status)}</span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link
                      className="btn btn-ghost btn-sm"
                      to={`/orders/${o.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('Track', 'Παρακολούθηση')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid g2 mt24">
          <div className="panel">
            <h3 style={{ fontSize: 16 }}>{t('Need something?', 'Χρειάζεστε κάτι;')}</h3>
            <p className="muted mt8" style={{ fontSize: 14 }}>
              {t(
                'Browse the catalogue to request a quote or submit an order — our team follows up by email.',
                'Δείτε τον κατάλογο για αίτημα προσφοράς ή παραγγελία — η ομάδα μας επικοινωνεί με email.',
              )}
            </p>
            <Link className="btn btn-ghost btn-sm mt16" to="/catalogue">
              {t('Browse catalogue', 'Δείτε κατάλογο')}
            </Link>
          </div>
          <div className="panel">
            <h3 style={{ fontSize: 16 }}>{t('Latest update', 'Τελευταία ενημέρωση')}</h3>
            {latest ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 12 }}>
                  <div>
                    <b>{latest.reference}</b>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {itemSummary(latest)}
                    </div>
                  </div>
                  <span className={`status ${STATUS_STYLE[latest.status]}`}>{statusLabel(latest.status)}</span>
                </div>
                {latest.status_history?.[latest.status_history.length - 1]?.note && (
                  <p className="muted mt8" style={{ fontSize: 13 }}>
                    “{latest.status_history[latest.status_history.length - 1].note}”
                  </p>
                )}
                <Link className="btn btn-ghost btn-sm mt16" to={`/orders/${latest.id}`}>
                  {t('Track order', 'Παρακολούθηση')}
                </Link>
              </>
            ) : (
              <p className="muted mt8" style={{ fontSize: 14 }}>
                {t('No orders yet.', 'Καμία παραγγελία ακόμη.')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Shown to signed-in members who are not yet approved (pending or rejected).
function PendingDashboard({ status }: { status: MemberStatus }) {
  const { t } = useLang()
  const rejected = status === 'rejected'

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="form center">
          <div
            className="ic"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: rejected ? 'rgba(255,86,86,.16)' : 'rgba(255,206,84,.16)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 18px',
              color: rejected ? '#ff7a7a' : '#ffce54',
              fontSize: 28,
            }}
          >
            {rejected ? <X size={28} aria-hidden /> : <Hourglass size={26} aria-hidden />}
          </div>
          <div className="eyebrow center">{t('Member area', 'Περιοχή μελών')}</div>
          <h2 className="h2 mt8">
            {rejected
              ? t('Account not approved', 'Ο λογαριασμός δεν εγκρίθηκε')
              : t('Pending approval', 'Σε αναμονή έγκρισης')}
          </h2>
          <p className="lead mt8" style={{ margin: '8px auto 0' }}>
            {rejected
              ? t(
                  'Your account was not approved for B2B access. If you think this is a mistake, contact partners@sls.gr.',
                  'Ο λογαριασμός σας δεν εγκρίθηκε για B2B πρόσβαση. Αν πρόκειται για λάθος, επικοινωνήστε στο partners@sls.gr.',
                )
              : t(
                  "Thanks for registering! An admin is reviewing your account. Once approved, pricing, cart and ordering unlock — you'll be able to see B2B prices right away.",
                  'Ευχαριστούμε για την εγγραφή! Ένας διαχειριστής ελέγχει τον λογαριασμό σας. Μόλις εγκριθεί, ξεκλειδώνουν τιμές, καλάθι και παραγγελίες.',
                )}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
            <Link className="btn btn-primary" to="/catalogue">
              {t('Browse catalogue', 'Δείτε κατάλογο')}
            </Link>
            <Link className="btn btn-ghost" to="/">
              {t('Back to home', 'Επιστροφή στην αρχική')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

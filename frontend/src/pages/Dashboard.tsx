import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { fetchOrders, type Order, type OrderStatus } from '../lib/api'

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: 'wait',
  quoted: 'ok',
  confirmed: 'ok',
  in_production: 'blue',
  completed: 'ok',
  cancelled: 'rej',
}

export default function Dashboard() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch(() => {})
  }, [])

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
    const upcomingRentals = orders.filter((o) => o.type === 'rental' && ['pending', 'confirmed'].includes(o.status)).length
    return { openQuotes, activeOrders, upcomingRentals }
  }, [orders])

  const statusLabel = (s: OrderStatus) =>
    ({
      pending: t('Awaiting', 'Σε αναμονή'),
      quoted: t('Quoted', 'Προσφορά'),
      confirmed: t('Confirmed', 'Επιβεβαιωμένο'),
      in_production: t('In production', 'Σε παραγωγή'),
      completed: t('Completed', 'Ολοκληρώθηκε'),
      cancelled: t('Cancelled', 'Ακυρώθηκε'),
    })[s]

  const typeLabel = (o: Order) => {
    const base = { quote: t('Quote', 'Προσφορά'), order: t('Order', 'Παραγγελία'), rental: t('Rental', 'Ενοικίαση') }[o.type]
    const mode = o.items[0]?.mode
    return mode ? `${mode === 'rent' ? t('Rent', 'Ενοικ.') : t('Buy', 'Αγορά')} · ${base}` : base
  }

  const itemSummary = (o: Order) =>
    o.items.map((i) => `${i.name}${i.qty ? ` × ${i.qty}` : ''}`).join(', ')

  const upcomingRental = orders.find((o) => o.type === 'rental' && ['pending', 'confirmed'].includes(o.status))

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
          <a className="on">▦ {t('Dashboard', 'Πίνακας')}</a>
          <Link to="/catalogue">▤ {t('Catalogue', 'Κατάλογος')}</Link>
          <a>✎ {t('Quotes', 'Προσφορές')}</a>
          <a>▣ {t('Orders', 'Παραγγελίες')}</a>
          <a>◷ {t('Rentals', 'Ενοικιάσεις')}</a>
          <a>€ {t('Invoices', 'Τιμολόγια')}</a>
          <a>◱ {t('Company profile', 'Προφίλ εταιρείας')}</a>
        </nav>
      </aside>

      <div className="dash-main">
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
            <div className="n">{kpis.upcomingRentals}</div>
            <div className="l">{t('Upcoming rentals', 'Επερχ. ενοικιάσεις')}</div>
          </div>
          <div className="kpi">
            <div className="n" style={{ color: '#ffce54' }}>
              € 4.1k
            </div>
            <div className="l">{t('Invoices due', 'Οφειλόμενα τιμολόγια')}</div>
          </div>
        </div>

        <h3 className="head mt40" style={{ fontSize: 15, letterSpacing: 1, color: 'var(--grey)' }}>
          {t('RECENT QUOTES & ORDERS', 'ΠΡΟΣΦΑΤΕΣ ΠΡΟΣΦΟΡΕΣ & ΠΑΡΑΓΓΕΛΙΕΣ')}
        </h3>
        <table className="tbl mt16">
          <tbody>
            <tr>
              <th>#</th>
              <th>{t('Item', 'Είδος')}</th>
              <th>{t('Type', 'Τύπος')}</th>
              <th>{t('Total (ex VAT)', 'Σύνολο (χ/ΦΠΑ)')}</th>
              <th>{t('Status', 'Κατάσταση')}</th>
            </tr>
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  {t('No requests yet — browse the catalogue to get started.', 'Καμία αίτηση ακόμη — δείτε τον κατάλογο.')}
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.reference.replace('SLS-', '')}</td>
                <td>{itemSummary(o)}</td>
                <td>{typeLabel(o)}</td>
                <td>{o.total ?? '—'}</td>
                <td>
                  <span className={`status ${STATUS_STYLE[o.status]}`}>{statusLabel(o.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid g2 mt24">
          <div className="panel">
            <h3 style={{ fontSize: 16 }}>{t('Upcoming rental', 'Επόμενη ενοικίαση')}</h3>
            {upcomingRental ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
                <img
                  src="/assets/lighting.jpg"
                  style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 8 }}
                  alt=""
                />
                <div>
                  <b>{itemSummary(upcomingRental)}</b>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {upcomingRental.items[0]?.from
                      ? `${upcomingRental.items[0].from}–${upcomingRental.items[0].to}`
                      : upcomingRental.reference}
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted mt8" style={{ fontSize: 14 }}>
                {t('No upcoming rentals.', 'Καμία επερχόμενη ενοικίαση.')}
              </p>
            )}
          </div>
          <div className="panel">
            <h3 style={{ fontSize: 16 }}>{t('Latest invoice', 'Τελευταίο τιμολόγιο')}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <div>
                <b>INV-3391</b>
                <div className="muted" style={{ fontSize: 13 }}>
                  {t('Due 30 Aug · bank transfer (IBAN) · incl. VAT 24%', 'Λήξη 30 Αυγ · έμβασμα (IBAN) · με ΦΠΑ 24%')}
                </div>
              </div>
              <b className="price">€ 4,100</b>
            </div>
            <a className="btn btn-ghost btn-sm mt16">{t('Download PDF', 'Λήψη PDF')}</a>
          </div>
        </div>
      </div>
    </div>
  )
}

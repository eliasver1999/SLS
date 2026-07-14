import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import {
  createProduct,
  deleteProduct,
  fetchOrders,
  fetchPartnerApplications,
  fetchProducts,
  updateOrder,
  updatePartnerApplication,
  updateProduct,
  type ApplicationCounts,
  type Order,
  type OrderStatus,
  type OrderType,
  type PartnerApplication,
  type ProductInput,
} from '../lib/api'
import type { LS, Mode, Product, Spec } from '../data/products'

type Section = 'approvals' | 'products' | 'orders' | 'quotes' | 'rentals'

export default function Admin() {
  const { t } = useLang()
  const { user } = useAuth()
  const [section, setSection] = useState<Section>('approvals')

  const [apps, setApps] = useState<PartnerApplication[]>([])
  const [counts, setCounts] = useState<ApplicationCounts>({ pending: 0, approved: 0, rejected: 0 })
  const [products, setProducts] = useState<Product[]>([])

  const loadApps = useCallback(async () => {
    try {
      const res = await fetchPartnerApplications('pending')
      setApps(res.data)
      setCounts(res.counts)
    } catch {
      /* ignore */
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await fetchProducts())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadApps()
    loadProducts()
  }, [loadApps, loadProducts])

  const nav: { key: Section; icon: string; label: string; badge?: number }[] = [
    { key: 'approvals', icon: '✔', label: t('Approvals', 'Εγκρίσεις'), badge: counts.pending },
    { key: 'products', icon: '▤', label: t('Products', 'Προϊόντα'), badge: products.length },
    { key: 'orders', icon: '▣', label: t('Orders', 'Παραγγελίες') },
    { key: 'quotes', icon: '✎', label: t('Quotes', 'Προσφορές') },
    { key: 'rentals', icon: '◷', label: t('Rentals', 'Ενοικιάσεις') },
  ]

  return (
    <div className="dash">
      <aside className="side">
        <div className="u">
          <div className="av" style={{ background: 'linear-gradient(135deg,#ff7a7a,#b0324f)' }}>
            AD
          </div>
          <div>
            <b style={{ fontSize: 14 }}>{user?.name ?? 'Admin'}</b>
            <div className="muted" style={{ fontSize: 12 }}>
              SLS
            </div>
          </div>
        </div>
        <nav>
          {nav.map((n) => (
            <a
              key={n.key}
              className={section === n.key ? 'on' : undefined}
              style={{ cursor: 'pointer' }}
              onClick={() => setSection(n.key)}
            >
              {n.icon} {n.label}
              {n.badge != null && (
                <span className="status wait" style={{ marginLeft: 'auto' }}>
                  {n.badge}
                </span>
              )}
            </a>
          ))}
        </nav>
      </aside>

      <div className="dash-main">
        {section === 'approvals' && (
          <ApprovalsSection apps={apps} counts={counts} onReload={loadApps} />
        )}
        {section === 'products' && <ProductsSection products={products} onReload={loadProducts} />}
        {section === 'orders' && <OrdersSection type="order" />}
        {section === 'quotes' && <OrdersSection type="quote" />}
        {section === 'rentals' && <OrdersSection type="rental" />}
        <Link className="btn btn-ghost btn-sm mt24" to="/">
          {t('← Back to site', '← Πίσω στον ιστότοπο')}
        </Link>
      </div>
    </div>
  )
}

// ── Approvals ───────────────────────────────────────────────────────
function ApprovalsSection({
  apps,
  counts,
  onReload,
}: {
  apps: PartnerApplication[]
  counts: ApplicationCounts
  onReload: () => void
}) {
  const { t } = useLang()
  const [selected, setSelected] = useState<PartnerApplication | null>(apps[0] ?? null)

  useEffect(() => {
    setSelected((cur) => apps.find((a) => a.id === cur?.id) ?? apps[0] ?? null)
  }, [apps])

  async function decide(app: PartnerApplication, status: 'approved' | 'rejected') {
    try {
      await updatePartnerApplication(app.id, status)
      onReload()
    } catch {
      /* ignore */
    }
  }

  const buysLabel = (b: string[]) => b.map((x) => x[0].toUpperCase() + x.slice(1)).join(', ')

  return (
    <>
      <h1 className="h2" style={{ fontSize: 26 }}>
        {t('Member approvals', 'Εγκρίσεις μελών')}
      </h1>
      <p className="muted">
        {t('Review applications and approve or reject B2B access.', 'Ελέγξτε αιτήσεις και εγκρίνετε ή απορρίψτε.')}
      </p>

      <div className="kpis mt24">
        <Kpi n={counts.pending} color="#ffce54" label={t('Pending', 'Σε αναμονή')} />
        <Kpi n={counts.approved} color="#48d38a" label={t('Approved', 'Εγκεκριμένοι')} />
        <Kpi n={counts.rejected} color="#ff7a7a" label={t('Rejected', 'Απορριφθέντες')} />
        <Kpi n={42} blue label={t('Open orders', 'Ανοιχτές παραγγ.')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22, marginTop: 24, alignItems: 'start' }}>
        <table className="tbl">
          <tbody>
            <tr>
              <th>{t('Company', 'Εταιρεία')}</th>
              <th>{t('VAT', 'ΑΦΜ')}</th>
              <th>{t('Contact / role', 'Επαφή / ρόλος')}</th>
              <th>{t('Action', 'Ενέργεια')}</th>
            </tr>
            {apps.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  {t('No pending applications 🎉', 'Καμία εκκρεμής αίτηση 🎉')}
                </td>
              </tr>
            )}
            {apps.map((a) => (
              <tr
                key={a.id}
                onClick={() => setSelected(a)}
                style={{ cursor: 'pointer', background: selected?.id === a.id ? 'rgba(31,139,255,.06)' : undefined }}
              >
                <td>
                  <b>{a.company}</b>
                </td>
                <td>{a.vat}</td>
                <td>
                  {a.contact_name} · <span className="muted">{a.role}</span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); decide(a, 'approved') }}>
                    {t('Approve', 'Έγκριση')}
                  </span>{' '}
                  <span className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); decide(a, 'rejected') }}>
                    {t('Reject', 'Απόρριψη')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <aside className="panel">
          <div className="eyebrow">{t('Applicant', 'Αιτών')}</div>
          {selected ? (
            <>
              <h3 className="mt8" style={{ fontSize: 20 }}>
                {selected.company}
              </h3>
              <table className="spec-table">
                <tbody>
                  <tr><td>{t('Reference', 'Αριθμός')}</td><td>{selected.reference}</td></tr>
                  <tr><td>VAT</td><td>{selected.vat}</td></tr>
                  <tr><td>{t('Contact', 'Επαφή')}</td><td>{selected.contact_name}</td></tr>
                  <tr><td>{t('Role', 'Ρόλος')}</td><td>{selected.role}</td></tr>
                  <tr><td>Email</td><td>{selected.email}</td></tr>
                  <tr><td>{t('Buys / rents', 'Αγοράζει / ενοικ.')}</td><td>{buysLabel(selected.buys ?? [])}</td></tr>
                </tbody>
              </table>
              {selected.message && (
                <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
                  “{selected.message}”
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <a className="btn btn-primary btn-block" onClick={() => decide(selected, 'approved')}>
                  {t('Approve & email', 'Έγκριση & email')}
                </a>
                <a className="btn btn-ghost" onClick={() => decide(selected, 'rejected')}>
                  {t('Reject', 'Απόρριψη')}
                </a>
              </div>
            </>
          ) : (
            <p className="muted mt8" style={{ fontSize: 14 }}>
              {t('Select an applicant to review.', 'Επιλέξτε αιτούντα.')}
            </p>
          )}
        </aside>
      </div>
    </>
  )
}

// ── Products ────────────────────────────────────────────────────────
function ProductsSection({ products, onReload }: { products: Product[]; onReload: () => void }) {
  const { t, lang } = useLang()
  const [editing, setEditing] = useState<ProductInput | null>(null)
  const [originalSlug, setOriginalSlug] = useState<string | null>(null)

  function addNew() {
    setOriginalSlug(null)
    setEditing(blankInput())
  }
  function edit(p: Product) {
    setOriginalSlug(p.slug)
    setEditing(toInput(p))
  }
  async function remove(p: Product) {
    if (!confirm(t(`Delete "${p.name}"?`, `Διαγραφή "${p.name}";`))) return
    try {
      await deleteProduct(p.slug)
      onReload()
    } catch {
      /* ignore */
    }
  }

  if (editing) {
    return (
      <ProductForm
        draft={editing}
        isNew={originalSlug === null}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          onReload()
        }}
        originalSlug={originalSlug}
      />
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="h2" style={{ fontSize: 26 }}>
            {t('Products', 'Προϊόντα')}
          </h1>
          <p className="muted">
            {t('Add, edit and remove catalogue products.', 'Προσθήκη, επεξεργασία και διαγραφή προϊόντων.')}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={addNew}>
          + {t('Add product', 'Νέο προϊόν')}
        </button>
      </div>

      <table className="tbl mt24">
        <tbody>
          <tr>
            <th>{t('Name', 'Όνομα')}</th>
            <th>{t('Category', 'Κατηγορία')}</th>
            <th>{t('Modes', 'Λειτουργίες')}</th>
            <th>{t('Price', 'Τιμή')}</th>
            <th>{t('Action', 'Ενέργεια')}</th>
          </tr>
          {products.map((p) => (
            <tr key={p.slug}>
              <td>
                <b>{p.name}</b> {p.featured && <span className="status blue">★</span>}
              </td>
              <td className="muted">{p.category}</td>
              <td className="muted">{p.modes.join(' / ')}</td>
              <td>{p.buy?.price ?? p.rent?.price ?? '—'}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <span className="btn btn-ghost btn-sm" onClick={() => edit(p)}>
                  {t('Edit', 'Επεξεργασία')}
                </span>{' '}
                <span className="btn btn-ghost btn-sm" onClick={() => remove(p)}>
                  {t('Delete', 'Διαγραφή')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted mt16" style={{ fontSize: 13 }}>
        {lang === 'el'
          ? 'Οι αλλαγές εμφανίζονται άμεσα στον κατάλογο.'
          : 'Changes appear in the public catalogue immediately.'}
      </p>
    </>
  )
}

function ProductForm({
  draft,
  isNew,
  originalSlug,
  onCancel,
  onSaved,
}: {
  draft: ProductInput
  isNew: boolean
  originalSlug: string | null
  onCancel: () => void
  onSaved: () => void
}) {
  const { t } = useLang()
  const [form, setForm] = useState<ProductInput>(draft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const upd = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }))
  const updLS = (k: 'tag' | 'blurb', lng: keyof LS, v: string) =>
    setForm((f) => ({ ...f, [k]: { ...f[k], [lng]: v } }))
  const toggleMode = (m: Mode) =>
    setForm((f) => ({
      ...f,
      modes: f.modes.includes(m) ? f.modes.filter((x) => x !== m) : [...f.modes, m],
    }))

  async function save() {
    setSaving(true)
    setError('')
    const payload: ProductInput = {
      ...form,
      thumbs: form.thumbs.length ? form.thumbs : [form.image],
      buy: form.modes.includes('buy') ? form.buy : null,
      rent: form.modes.includes('rent') ? form.rent : null,
    }
    try {
      if (isNew) await createProduct(payload)
      else await updateProduct(originalSlug!, payload)
      onSaved()
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('Could not save. Check the fields and try again.', 'Αποτυχία αποθήκευσης. Ελέγξτε τα πεδία.')
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const field = { marginBottom: 0 }

  return (
    <>
      <h1 className="h2" style={{ fontSize: 24 }}>
        {isNew ? t('Add product', 'Νέο προϊόν') : t('Edit product', 'Επεξεργασία προϊόντος')}
      </h1>

      <div className="panel mt24" style={{ maxWidth: 820 }}>
        <div className="row2">
          <div className="field" style={field}>
            <label>{t('Slug (URL id)', 'Slug (URL)')}</label>
            <input value={form.slug} onChange={(e) => upd('slug', e.target.value)} placeholder="aurora-p26" />
          </div>
          <div className="field" style={field}>
            <label>{t('Name', 'Όνομα')}</label>
            <input value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="Aurora P2.6" />
          </div>
        </div>

        <div className="row2 mt16">
          <div className="field" style={field}>
            <label>{t('Category', 'Κατηγορία')}</label>
            <select value={form.category} onChange={(e) => upd('category', e.target.value as ProductInput['category'])}>
              <option value="screens">screens</option>
              <option value="lighting">lighting</option>
              <option value="sound">sound</option>
              <option value="package">package</option>
            </select>
          </div>
          <div className="field" style={field}>
            <label>{t('Placement key', 'Placement')}</label>
            <input value={form.placement_key} onChange={(e) => upd('placement_key', e.target.value)} placeholder="indoor" />
          </div>
        </div>

        <div className="field mt16" style={field}>
          <label>{t('Image path', 'Εικόνα')}</label>
          <input value={form.image} onChange={(e) => upd('image', e.target.value)} placeholder="/assets/led-wall.jpg" />
        </div>

        <div className="row2 mt16">
          <div className="field" style={field}>
            <label>{t('Tag (EN)', 'Ετικέτα (EN)')}</label>
            <input value={form.tag.en} onChange={(e) => updLS('tag', 'en', e.target.value)} placeholder="Indoor" />
          </div>
          <div className="field" style={field}>
            <label>{t('Tag (ΕΛ)', 'Ετικέτα (ΕΛ)')}</label>
            <input value={form.tag.el} onChange={(e) => updLS('tag', 'el', e.target.value)} placeholder="Εσωτ." />
          </div>
        </div>

        <div className="row2 mt16">
          <div className="field" style={field}>
            <label>{t('Blurb (EN)', 'Περιγραφή (EN)')}</label>
            <textarea rows={2} value={form.blurb.en} onChange={(e) => updLS('blurb', 'en', e.target.value)} />
          </div>
          <div className="field" style={field}>
            <label>{t('Blurb (ΕΛ)', 'Περιγραφή (ΕΛ)')}</label>
            <textarea rows={2} value={form.blurb.el} onChange={(e) => updLS('blurb', 'el', e.target.value)} />
          </div>
        </div>

        <div className="field mt16" style={field}>
          <label>{t('Modes', 'Λειτουργίες')}</label>
          <div>
            <span className={`chip${form.modes.includes('buy') ? ' on' : ''}`} onClick={() => toggleMode('buy')}>
              {t('Buy', 'Αγορά')}
            </span>
            <span className={`chip${form.modes.includes('rent') ? ' on' : ''}`} onClick={() => toggleMode('rent')}>
              {t('Rent', 'Ενοικίαση')}
            </span>
            <span className={`chip${form.featured ? ' on' : ''}`} onClick={() => upd('featured', !form.featured)}>
              ★ {t('Featured', 'Προτεινόμενο')}
            </span>
          </div>
        </div>

        {form.modes.includes('buy') && (
          <div className="mt16">
            <h4 className="head" style={{ fontSize: 13, color: 'var(--grey)', letterSpacing: 1 }}>
              {t('BUY PRICE', 'ΤΙΜΗ ΑΓΟΡΑΣ')}
            </h4>
            <div className="row2 mt8">
              <div className="field" style={field}>
                <label>{t('Price', 'Τιμή')}</label>
                <input value={form.buy?.price ?? ''} onChange={(e) => upd('buy', { price: e.target.value, unit: form.buy?.unit ?? ls(), leadTime: form.buy?.leadTime ?? ls() })} placeholder="€ 6,900" />
              </div>
              <div className="field" style={field}>
                <label>{t('Unit (EN)', 'Μονάδα (EN)')}</label>
                <input value={form.buy?.unit.en ?? ''} onChange={(e) => upd('buy', { price: form.buy?.price ?? '', unit: { en: e.target.value, el: form.buy?.unit.el ?? '' }, leadTime: form.buy?.leadTime ?? ls() })} placeholder="/ panel · ex VAT" />
              </div>
            </div>
            <div className="field mt8" style={field}>
              <label>{t('Lead time (EN)', 'Χρόνος (EN)')}</label>
              <input value={form.buy?.leadTime.en ?? ''} onChange={(e) => upd('buy', { price: form.buy?.price ?? '', unit: form.buy?.unit ?? ls(), leadTime: { en: e.target.value, el: form.buy?.leadTime.el ?? '' } })} placeholder="Made to order · 3–4 weeks" />
            </div>
          </div>
        )}

        {form.modes.includes('rent') && (
          <div className="mt16">
            <h4 className="head" style={{ fontSize: 13, color: 'var(--grey)', letterSpacing: 1 }}>
              {t('RENT PRICE', 'ΤΙΜΗ ΕΝΟΙΚΙΑΣΗΣ')}
            </h4>
            <div className="row2 mt8">
              <div className="field" style={field}>
                <label>{t('Price', 'Τιμή')}</label>
                <input value={form.rent?.price ?? ''} onChange={(e) => upd('rent', { price: e.target.value, unit: form.rent?.unit ?? ls() })} placeholder="€ 55" />
              </div>
              <div className="field" style={field}>
                <label>{t('Unit (EN)', 'Μονάδα (EN)')}</label>
                <input value={form.rent?.unit.en ?? ''} onChange={(e) => upd('rent', { price: form.rent?.price ?? '', unit: { en: e.target.value, el: form.rent?.unit.el ?? '' } })} placeholder="/ panel / day" />
              </div>
            </div>
          </div>
        )}

        <SpecEditor
          title={t('Card specs (shown on cards)', 'Specs κάρτας')}
          specs={form.card_specs}
          onChange={(s) => upd('card_specs', s)}
        />
        <SpecEditor
          title={t('Spec table (product page)', 'Πίνακας specs')}
          specs={form.spec_table}
          onChange={(s) => upd('spec_table', s)}
        />

        {error && (
          <div className="notice mt16" style={{ borderColor: 'rgba(255,86,86,.35)', background: 'rgba(255,86,86,.08)' }}>
            <div className="ic" style={{ color: '#ff7a7a' }}>!</div>
            <div>{error}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? t('Saving…', 'Αποθήκευση…') : t('Save product', 'Αποθήκευση')}
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>
            {t('Cancel', 'Άκυρο')}
          </button>
        </div>
      </div>
    </>
  )
}

function SpecEditor({
  title,
  specs,
  onChange,
}: {
  title: string
  specs: Spec[]
  onChange: (s: Spec[]) => void
}) {
  const { t } = useLang()
  const setRow = (i: number, patch: Partial<Spec>) =>
    onChange(specs.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  const setField = (i: number, part: 'label' | 'value', lng: keyof LS, v: string) =>
    setRow(i, { [part]: { ...specs[i][part], [lng]: v } } as Partial<Spec>)

  return (
    <div className="mt16">
      <h4 className="head" style={{ fontSize: 13, color: 'var(--grey)', letterSpacing: 1, marginBottom: 8 }}>
        {title.toUpperCase()}
      </h4>
      {specs.map((s, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8 }}>
          <input
            placeholder={t('Label (EN)', 'Ετικέτα (EN)')}
            value={s.label.en}
            onChange={(e) => setField(i, 'label', 'en', e.target.value)}
            style={inp}
          />
          <input
            placeholder={t('Value (EN)', 'Τιμή (EN)')}
            value={s.value.en}
            onChange={(e) => setField(i, 'value', 'en', e.target.value)}
            style={inp}
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onChange(specs.filter((_, idx) => idx !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onChange([...specs, { label: ls(), value: ls() }])}
      >
        + {t('Add row', 'Προσθήκη')}
      </button>
    </div>
  )
}

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'quoted',
  'confirmed',
  'in_production',
  'completed',
  'cancelled',
]

function OrdersSection({ type }: { type: OrderType }) {
  const { t } = useLang()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetchOrders({ type })
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [type])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(o: Order, status: OrderStatus) {
    // optimistic update
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status } : x)))
    try {
      await updateOrder(o.id, { status })
    } catch {
      load()
    }
  }

  const heading = { order: t('Orders', 'Παραγγελίες'), quote: t('Quotes', 'Προσφορές'), rental: t('Rentals', 'Ενοικιάσεις') }[type]
  const statusText = (s: OrderStatus) =>
    ({
      pending: t('Pending', 'Σε αναμονή'),
      quoted: t('Quoted', 'Προσφορά'),
      confirmed: t('Confirmed', 'Επιβεβ.'),
      in_production: t('In production', 'Σε παραγωγή'),
      completed: t('Completed', 'Ολοκληρ.'),
      cancelled: t('Cancelled', 'Ακυρώθηκε'),
    })[s]

  return (
    <>
      <h1 className="h2" style={{ fontSize: 26 }}>
        {heading}
      </h1>
      <p className="muted">
        {t('Manage requests and update their status.', 'Διαχείριση αιτημάτων και κατάστασης.')}
      </p>

      <table className="tbl mt24">
        <tbody>
          <tr>
            <th>#</th>
            <th>{t('Company', 'Εταιρεία')}</th>
            <th>{t('Items', 'Είδη')}</th>
            <th>{t('Total', 'Σύνολο')}</th>
            <th>{t('Status', 'Κατάσταση')}</th>
          </tr>
          {loading && (
            <tr>
              <td colSpan={5} className="muted">
                {t('Loading…', 'Φόρτωση…')}
              </td>
            </tr>
          )}
          {!loading && orders.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                {t('No requests yet.', 'Καμία αίτηση ακόμη.')}
              </td>
            </tr>
          )}
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.reference.replace('SLS-', '')}</td>
              <td>{o.company ?? o.contact_name}</td>
              <td className="muted">
                {o.items.map((i) => `${i.name}${i.qty ? ` ×${i.qty}` : ''}`).join(', ')}
              </td>
              <td>{o.total ?? '—'}</td>
              <td>
                <select
                  value={o.status}
                  onChange={(e) => setStatus(o, e.target.value as OrderStatus)}
                  style={{
                    background: '#0b1119',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    color: '#fff',
                    padding: '6px 8px',
                    fontSize: 13,
                  }}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusText(s)}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function Kpi({ n, label, color, blue }: { n: number; label: string; color?: string; blue?: boolean }) {
  return (
    <div className="kpi">
      <div className={`n${blue ? ' blue' : ''}`} style={color ? { color } : undefined}>
        {n}
      </div>
      <div className="l">{label}</div>
    </div>
  )
}

// ── helpers ─────────────────────────────────────────────────────────
const ls = (): LS => ({ en: '', el: '' })
const inp: React.CSSProperties = {
  width: '100%',
  background: '#0b1119',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '10px 12px',
  color: '#fff',
  fontSize: 14,
}

function blankInput(): ProductInput {
  return {
    slug: '',
    name: '',
    category: 'screens',
    placement_key: 'indoor',
    image: '/assets/led-wall.jpg',
    tag: ls(),
    blurb: ls(),
    thumbs: [],
    card_specs: [],
    spec_table: [],
    modes: ['buy'],
    buy: { price: '', unit: ls(), leadTime: ls() },
    rent: null,
    featured: false,
  }
}

function toInput(p: Product): ProductInput {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    placement_key: p.placementKey,
    image: p.image,
    tag: p.tag,
    blurb: p.blurb,
    thumbs: p.thumbs,
    card_specs: p.cardSpecs,
    spec_table: p.specTable,
    modes: p.modes,
    buy: p.buy ?? null,
    rent: p.rent ?? null,
    featured: !!p.featured,
  }
}

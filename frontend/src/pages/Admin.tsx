import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import {
  createProduct,
  deleteProduct,
  fetchMembers,
  fetchOrders,
  fetchPartnerApplications,
  fetchProducts,
  updateMember,
  updateOrder,
  updatePartnerApplication,
  updateProduct,
  type ApplicationCounts,
  type Member,
  type MemberCounts,
  type Order,
  type OrderItem,
  type OrderStatus,
  type OrderType,
  type PartnerApplication,
  type ProductInput,
} from '../lib/api'
import type { LS, Mode, Product, Spec } from '../data/products'
import OrderTimeline from '../components/OrderTimeline'
import EmailTemplates from '../components/EmailTemplates'
import { STATUS_PILL } from '../lib/orderStatus'
import {
  ArrowLeft,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Mail,
  Package,
  PartyPopper,
  ShoppingCart,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react'

type Section = 'members' | 'approvals' | 'products' | 'orders' | 'quotes' | 'emails'

export default function Admin() {
  const { t } = useLang()
  const { user } = useAuth()
  const [section, setSection] = useState<Section>('members')

  const [members, setMembers] = useState<Member[]>([])
  const [memberCounts, setMemberCounts] = useState<MemberCounts>({ pending: 0, approved: 0, rejected: 0 })
  const [membersPage, setMembersPage] = useState({ page: 1, lastPage: 1 })
  const [apps, setApps] = useState<PartnerApplication[]>([])
  const [counts, setCounts] = useState<ApplicationCounts>({ pending: 0, approved: 0, rejected: 0 })
  const [products, setProducts] = useState<Product[]>([])
  const [productsInfo, setProductsInfo] = useState({ page: 1, lastPage: 1, total: 0 })

  const loadMembers = useCallback(async (page = 1) => {
    try {
      const res = await fetchMembers({ page })
      setMembers((prev) => (page === 1 ? res.items : [...prev, ...res.items]))
      setMemberCounts(res.counts)
      setMembersPage({ page: res.page, lastPage: res.lastPage })
    } catch {
      /* ignore */
    }
  }, [])

  const loadApps = useCallback(async () => {
    try {
      const res = await fetchPartnerApplications('pending')
      setApps(res.data)
      setCounts(res.counts)
    } catch {
      /* ignore */
    }
  }, [])

  const loadProducts = useCallback(async (page = 1) => {
    try {
      const res = await fetchProducts({ page })
      setProducts((prev) => (page === 1 ? res.items : [...prev, ...res.items]))
      setProductsInfo({ page: res.page, lastPage: res.lastPage, total: res.total })
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadMembers()
    loadApps()
    loadProducts()
  }, [loadMembers, loadApps, loadProducts])

  const nav: { key: Section; Icon: LucideIcon; label: string; badge?: number }[] = [
    { key: 'members', Icon: Users, label: t('Members', 'Μέλη'), badge: memberCounts.pending },
    { key: 'approvals', Icon: ClipboardCheck, label: t('Applications', 'Αιτήσεις'), badge: counts.pending },
    { key: 'products', Icon: Package, label: t('Products', 'Προϊόντα'), badge: productsInfo.total || products.length },
    { key: 'orders', Icon: ShoppingCart, label: t('Orders', 'Παραγγελίες') },
    { key: 'quotes', Icon: FileText, label: t('Quotes', 'Προσφορές') },
    { key: 'emails', Icon: Mail, label: t('Emails', 'Emails') },
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
              <n.Icon size={17} aria-hidden />
              {n.label}
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
        {section === 'members' && (
          <MembersSection
            members={members}
            counts={memberCounts}
            onReload={() => loadMembers(1)}
            hasMore={membersPage.page < membersPage.lastPage}
            onLoadMore={() => loadMembers(membersPage.page + 1)}
          />
        )}
        {section === 'approvals' && (
          <ApprovalsSection apps={apps} counts={counts} onReload={loadApps} />
        )}
        {section === 'products' && (
          <ProductsSection
            products={products}
            onReload={() => loadProducts(1)}
            hasMore={productsInfo.page < productsInfo.lastPage}
            onLoadMore={() => loadProducts(productsInfo.page + 1)}
          />
        )}
        {section === 'orders' && <OrdersSection type="order" />}
        {section === 'quotes' && <OrdersSection type="quote" />}
        {section === 'emails' && <EmailTemplates />}
        <Link className="btn btn-ghost btn-sm mt24" to="/">
          <ArrowLeft size={14} aria-hidden />
          {t('Back to site', 'Πίσω στον ιστότοπο')}
        </Link>
      </div>
    </div>
  )
}

// ── Members (registration approvals) ────────────────────────────────
function MembersSection({
  members,
  counts,
  onReload,
  hasMore,
  onLoadMore,
}: {
  members: Member[]
  counts: MemberCounts
  onReload: () => void
  hasMore: boolean
  onLoadMore: () => void
}) {
  const { t } = useLang()

  async function decide(m: Member, status: 'approved' | 'rejected') {
    try {
      await updateMember(m.id, status)
      onReload()
    } catch {
      /* ignore */
    }
  }

  const statusPill = (s: Member['status']) => {
    const map = {
      pending: { cls: 'wait', label: t('Pending', 'Σε αναμονή') },
      approved: { cls: 'ok', label: t('Approved', 'Εγκεκριμένος') },
      rejected: { cls: 'rej', label: t('Rejected', 'Απορρίφθηκε') },
    }[s]
    return <span className={`status ${map.cls}`}>{map.label}</span>
  }

  return (
    <>
      <h1 className="h2" style={{ fontSize: 26 }}>
        {t('Members', 'Μέλη')}
      </h1>
      <p className="muted">
        {t(
          'Registrations are admin-gated. Approve an account to unlock pricing, cart and ordering.',
          'Οι εγγραφές εγκρίνονται από διαχειριστή. Εγκρίνετε λογαριασμό για ξεκλείδωμα τιμών, καλαθιού και παραγγελιών.',
        )}
      </p>

      <div className="kpis mt24">
        <Kpi n={counts.pending} color="#ffce54" label={t('Pending', 'Σε αναμονή')} />
        <Kpi n={counts.approved} color="#48d38a" label={t('Approved', 'Εγκεκριμένοι')} />
        <Kpi n={counts.rejected} color="#ff7a7a" label={t('Rejected', 'Απορριφθέντες')} />
      </div>

      <table className="tbl mt24">
        <tbody>
          <tr>
            <th>{t('Name', 'Όνομα')}</th>
            <th>{t('Company', 'Εταιρεία')}</th>
            <th>Email</th>
            <th>{t('Status', 'Κατάσταση')}</th>
            <th>{t('Action', 'Ενέργεια')}</th>
          </tr>
          {members.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                {t('No registered members yet.', 'Καμία εγγραφή ακόμη.')}
              </td>
            </tr>
          )}
          {members.map((m) => (
            <tr key={m.id}>
              <td>
                <b>{m.name}</b>
              </td>
              <td className="muted">{m.company ?? '—'}</td>
              <td className="muted">{m.email}</td>
              <td>{statusPill(m.status)}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {m.status !== 'approved' && (
                  <span className="btn btn-primary btn-sm" onClick={() => decide(m, 'approved')}>
                    {t('Approve', 'Έγκριση')}
                  </span>
                )}{' '}
                {m.status !== 'rejected' && (
                  <span className="btn btn-ghost btn-sm" onClick={() => decide(m, 'rejected')}>
                    {t('Reject', 'Απόρριψη')}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={onLoadMore}>
            {t('Load more', 'Περισσότερα')}
          </button>
        </div>
      )}
    </>
  )
}

// ── Applications (partner applications) ──────────────────────────────
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
                  <PartyPopper size={15} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
                  {t('No pending applications', 'Καμία εκκρεμής αίτηση')}
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
function ProductsSection({
  products,
  onReload,
  hasMore,
  onLoadMore,
}: {
  products: Product[]
  onReload: () => void
  hasMore: boolean
  onLoadMore: () => void
}) {
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
                <b>{p.name}</b>{' '}
                {p.featured && (
                  <span className="status blue">
                    <Star size={11} aria-label="Featured" />
                  </span>
                )}
              </td>
              <td className="muted">{p.category}</td>
              <td className="muted">{p.buy ? t('Buy', 'Αγορά') : t('Quote', 'Προσφορά')}</td>
              <td>{p.buy?.price ?? '—'}</td>
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
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={onLoadMore}>
            {t('Load more', 'Περισσότερα')}
          </button>
        </div>
      )}
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
          <label>{t('Pricing', 'Τιμολόγηση')}</label>
          <div>
            <span className={`chip${form.modes.includes('buy') ? ' on' : ''}`} onClick={() => toggleMode('buy')}>
              {t('Buy (list price)', 'Αγορά (τιμή)')}
            </span>
            <span className={`chip${form.featured ? ' on' : ''}`} onClick={() => upd('featured', !form.featured)}>
              <Star size={12} aria-hidden style={{ verticalAlign: '-1px', marginRight: 4 }} />
              {t('Featured', 'Προτεινόμενο')}
            </span>
          </div>
          <p className="muted mt8" style={{ fontSize: 12.5 }}>
            {t(
              'Turn off Buy for quote-only products (no list price shown).',
              'Απενεργοποιήστε το «Αγορά» για προϊόντα μόνο με προσφορά (χωρίς εμφανιζόμενη τιμή).',
            )}
          </p>
        </div>

        {form.modes.includes('buy') && (
          <div className="mt16">
            <h4 className="head" style={{ fontSize: 13, color: 'var(--grey)', letterSpacing: 1 }}>
              {t('BUY PRICE', 'ΤΙΜΗ ΑΓΟΡΑΣ')}
            </h4>
            <div className="row2 mt8">
              <div className="field" style={field}>
                <label>{t('Price', 'Τιμή')}</label>
                <input value={form.buy?.price ?? ''} onChange={(e) => upd('buy', { price: e.target.value, unit: form.buy?.unit ?? ls(), leadTime: form.buy?.leadTime ?? ls() })} placeholder="€ 0.00" />
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
            <div className="ic" style={{ color: '#ff7a7a' }}><CircleAlert size={18} aria-hidden /></div>
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

const statusText = (s: OrderStatus, t: (en: string, el: string) => string) =>
  ({
    pending: t('Pending', 'Σε αναμονή'),
    quoted: t('Quoted', 'Προσφορά'),
    confirmed: t('Confirmed', 'Επιβεβ.'),
    in_production: t('In production', 'Σε παραγωγή'),
    completed: t('Completed', 'Ολοκληρ.'),
    cancelled: t('Cancelled', 'Ακυρώθηκε'),
  })[s]

function OrdersSection({ type }: { type: OrderType }) {
  const { t } = useLang()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [pageInfo, setPageInfo] = useState({ page: 1, lastPage: 1 })

  const load = useCallback(
    (page = 1) => {
      setLoading(true)
      fetchOrders({ type, page })
        .then((res) => {
          setOrders((prev) => (page === 1 ? res.items : [...prev, ...res.items]))
          setPageInfo({ page: res.page, lastPage: res.lastPage })
          setSelectedId((cur) =>
            page === 1 ? (res.items[0]?.id ?? null) : cur,
          )
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    },
    [type],
  )

  useEffect(() => {
    load(1)
  }, [load])

  const selected = orders.find((o) => o.id === selectedId) ?? null

  async function applyUpdate(patch: { status?: OrderStatus; total?: string | null; note?: string; items?: OrderItem[] }) {
    if (!selected) return
    const updated = await updateOrder(selected.id, patch)
    setOrders((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }

  const heading = { order: t('Orders', 'Παραγγελίες'), quote: t('Quotes', 'Προσφορές') }[type]

  return (
    <>
      <h1 className="h2" style={{ fontSize: 26 }}>
        {heading}
      </h1>
      <p className="muted">
        {t('Manage requests, update status and notify the customer.', 'Διαχείριση αιτημάτων, κατάστασης και ενημέρωση πελάτη.')}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22, marginTop: 24, alignItems: 'start' }}>
        <div>
        <table className="tbl">
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
              <tr
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                style={{ cursor: 'pointer', background: selectedId === o.id ? 'rgba(31,139,255,.06)' : undefined }}
              >
                <td>{o.reference.replace('SLS-', '')}</td>
                <td>{o.company ?? o.contact_name}</td>
                <td className="muted">
                  {o.items.map((i) => `${i.name}${i.qty ? ` ×${i.qty}` : ''}`).join(', ')}
                </td>
                <td>{o.total ?? '—'}</td>
                <td>
                  <span className={`status ${STATUS_PILL[o.status]}`}>{statusText(o.status, t)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          {pageInfo.page < pageInfo.lastPage && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => load(pageInfo.page + 1)}>
                {t('Load more', 'Περισσότερα')}
              </button>
            </div>
          )}
        </div>

        <aside className="panel">
          {selected ? (
            <AdminOrderDetail key={selected.id} order={selected} onUpdate={applyUpdate} />
          ) : (
            <p className="muted" style={{ fontSize: 14 }}>
              {t('Select a request to manage.', 'Επιλέξτε αίτημα για διαχείριση.')}
            </p>
          )}
        </aside>
      </div>
    </>
  )
}

function AdminOrderDetail({
  order,
  onUpdate,
}: {
  order: Order
  onUpdate: (patch: {
    status?: OrderStatus
    total?: string | null
    note?: string
    items?: OrderItem[]
  }) => Promise<void>
}) {
  const { t } = useLang()
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [total, setTotal] = useState(order.total ?? '')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<OrderItem[]>(order.items)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Re-sync the form after a save (parent passes back the server's order).
  useEffect(() => {
    setStatus(order.status)
    setTotal(order.total ?? '')
    setItems(order.items)
  }, [order])

  const setItem = (i: number, patch: Partial<OrderItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const addItem = () =>
    setItems((prev) => [...prev, { slug: `custom-${prev.length + 1}`, name: '', mode: 'buy', qty: 1, price: '' }])

  const itemsChanged = JSON.stringify(items) !== JSON.stringify(order.items)

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      // Clean up empty numeric/price fields before sending.
      const cleanItems = items
        .filter((it) => it.name.trim() !== '')
        .map((it) => ({
          ...it,
          name: it.name.trim(),
          qty: it.qty ? Number(it.qty) : undefined,
          price: it.price?.trim() || undefined,
        }))
      await onUpdate({
        status,
        total: total.trim() || null,
        note: note.trim() || undefined,
        items: itemsChanged && cleanItems.length ? cleanItems : undefined,
      })
      setNote('')
      setSaved(true)
    } catch {
      /* ignore */
    } finally {
      setSaving(false)
    }
  }

  const changed =
    status !== order.status ||
    (total.trim() || null) !== (order.total ?? null) ||
    note.trim() !== '' ||
    itemsChanged

  return (
    <>
      <div className="eyebrow">{order.reference}</div>
      <h3 className="mt8" style={{ fontSize: 18 }}>
        {order.company ?? order.contact_name}
      </h3>
      <div className="muted" style={{ fontSize: 13 }}>
        {order.contact_email}
      </div>

      <h4 className="head mt16" style={{ fontSize: 12.5, letterSpacing: 1, color: 'var(--grey)', marginBottom: 8 }}>
        {t('LINE ITEMS', 'ΕΙΔΗ')}
      </h4>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 56px 84px auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <input
            style={inp}
            value={it.name}
            placeholder={t('Item name', 'Όνομα είδους')}
            onChange={(e) => setItem(i, { name: e.target.value })}
          />
          <input
            style={inp}
            value={it.qty ?? ''}
            placeholder="Qty"
            inputMode="numeric"
            onChange={(e) => setItem(i, { qty: e.target.value ? parseInt(e.target.value, 10) || undefined : undefined })}
          />
          <input
            style={inp}
            value={it.price ?? ''}
            placeholder="€ —"
            onChange={(e) => setItem(i, { price: e.target.value })}
          />
          <button className="btn btn-ghost btn-sm" onClick={() => removeItem(i)} title={t('Remove', 'Αφαίρεση')}>
            ✕
          </button>
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={addItem}>
        + {t('Add line', 'Προσθήκη είδους')}
      </button>

      <div className="field mt16" style={{ marginBottom: 0 }}>
        <label>{t('Status', 'Κατάσταση')}</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          style={{ width: '100%', background: '#0b1119', border: '1px solid var(--line)', borderRadius: 10, color: '#fff', padding: '10px 12px', fontSize: 14 }}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusText(s, t)}
            </option>
          ))}
        </select>
      </div>

      <div className="field mt16" style={{ marginBottom: 0 }}>
        <label>{t('Total / price (ex VAT)', 'Σύνολο / τιμή (χ/ΦΠΑ)')}</label>
        <input value={total} onChange={(e) => setTotal(e.target.value)} placeholder="€ 12,500" />
      </div>

      <div className="field mt16" style={{ marginBottom: 0 }}>
        <label>{t('Note to customer (optional)', 'Σημείωση προς πελάτη (προαιρετικό)')}</label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('Added to the email and the order history…', 'Προστίθεται στο email και στο ιστορικό…')}
        />
      </div>

      <button className="btn btn-primary btn-block mt16" onClick={save} disabled={saving || !changed}>
        {saving ? t('Saving…', 'Αποθήκευση…') : t('Update & notify customer', 'Ενημέρωση & email πελάτη')}
      </button>
      {saved && (
        <p className="muted mt8" style={{ fontSize: 12.5, color: '#48d38a' }}>
          {t('Saved — the customer has been emailed.', 'Αποθηκεύτηκε — στάλθηκε email στον πελάτη.')}
        </p>
      )}

      <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '20px 0' }} />
      <OrderTimeline order={order} />
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
    // Admins are always approved, so the API includes the price; fall back to
    // an empty field rather than dropping it if it ever arrives absent.
    buy: p.buy ? { ...p.buy, price: p.buy.price ?? '' } : null,
    featured: !!p.featured,
  }
}

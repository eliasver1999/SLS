import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { createPartnerApplication } from '../lib/api'

export default function Apply() {
  const { t } = useLang()
  const [pending, setPending] = useState(false)
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [errorMsg, setErrorMsg] = useState('')
  const [fields, setFields] = useState({
    company: '',
    vat: '',
    contact_name: '',
    role: '',
    email: '',
    phone: '',
    message: '',
  })
  const [chips, setChips] = useState<Record<string, boolean>>({
    screens: true,
    lighting: true,
    sound: false,
    packages: false,
  })
  const [agree, setAgree] = useState(true)

  const toggle = (k: string) => setChips((c) => ({ ...c, [k]: !c[k] }))
  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setErrorMsg('')
    const buys = Object.entries(chips)
      .filter(([, on]) => on)
      .map(([k]) => k)
    try {
      const app = await createPartnerApplication({ ...fields, buys })
      setReference(app.reference)
      setPending(true)
      window.scrollTo(0, 0)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
      } else {
        setErrorMsg(
          t('Could not submit your application. Please try again.', 'Δεν ήταν δυνατή η υποβολή. Δοκιμάστε ξανά.'),
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const err = (k: string) =>
    errors[k]?.length ? (
      <span style={{ color: '#ff7a7a', fontSize: 12, marginTop: 4, display: 'block' }}>
        {errors[k][0]}
      </span>
    ) : null

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Home / {t('Become a Partner', 'Γίνετε Συνεργάτης')}</div>
          <div className="eyebrow">{t('B2B Access', 'B2B Πρόσβαση')}</div>
          <h1 className="h2 mt8">
            {t('Apply for approved access', 'Αίτηση για εγκεκριμένη πρόσβαση')}
          </h1>
          <p className="lead mt8">
            {t(
              'Approved businesses see pricing, buy made-to-order and book rentals. Vetting takes ~1 business day.',
              'Οι εγκεκριμένες επιχειρήσεις βλέπουν τιμές, αγοράζουν κατά παραγγελία και κάνουν κρατήσεις. Ο έλεγχος διαρκεί ~1 εργάσιμη.',
            )}
          </p>
        </div>
      </div>

      <section className="section-sm">
        {!pending ? (
          <div
            className="container"
            style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 30, alignItems: 'start' }}
          >
            <form className="form" onSubmit={onSubmit}>
              <div className="row2">
                <div className="field">
                  <label>{t('Company name', 'Επωνυμία εταιρείας')}</label>
                  <input placeholder="Nova Events Ltd" value={fields.company} onChange={set('company')} />
                  {err('company')}
                </div>
                <div className="field">
                  <label>{t('VAT / Tax number', 'ΑΦΜ / Αριθμός ΦΠΑ')}</label>
                  <input placeholder="EL123456789" value={fields.vat} onChange={set('vat')} />
                  {err('vat')}
                </div>
              </div>
              <div className="row2">
                <div className="field">
                  <label>{t('Contact name', 'Όνομα επικοινωνίας')}</label>
                  <input placeholder="Maria Papadopoulou" value={fields.contact_name} onChange={set('contact_name')} />
                  {err('contact_name')}
                </div>
                <div className="field">
                  <label>{t('Role', 'Ρόλος')}</label>
                  <input placeholder="Production Manager" value={fields.role} onChange={set('role')} />
                  {err('role')}
                </div>
              </div>
              <div className="row2">
                <div className="field">
                  <label>{t('Business email', 'Επαγγελματικό email')}</label>
                  <input placeholder="maria@novaevents.gr" value={fields.email} onChange={set('email')} />
                  {err('email')}
                </div>
                <div className="field">
                  <label>{t('Phone', 'Τηλέφωνο')}</label>
                  <input placeholder="+30 210 000 0000" value={fields.phone} onChange={set('phone')} />
                  {err('phone')}
                </div>
              </div>
              <div className="field">
                <label>{t('What do you buy / rent?', 'Τι αγοράζετε / ενοικιάζετε;')}</label>
                <div>
                  <span
                    className={`chip${chips.screens ? ' on' : ''}`}
                    onClick={() => toggle('screens')}
                  >
                    {t('LED screens', 'LED οθόνες')}
                  </span>
                  <span
                    className={`chip${chips.lighting ? ' on' : ''}`}
                    onClick={() => toggle('lighting')}
                  >
                    {t('Lighting', 'Φωτισμός')}
                  </span>
                  <span
                    className={`chip${chips.sound ? ' on' : ''}`}
                    onClick={() => toggle('sound')}
                  >
                    {t('Sound', 'Ήχος')}
                  </span>
                  <span
                    className={`chip${chips.packages ? ' on' : ''}`}
                    onClick={() => toggle('packages')}
                  >
                    {t('Full packages', 'Πλήρη πακέτα')}
                  </span>
                </div>
              </div>
              <div className="field">
                <label>{t('Tell us about your business', 'Πείτε μας για την επιχείρησή σας')}</label>
                <textarea
                  rows={3}
                  value={fields.message}
                  onChange={set('message')}
                  placeholder={t(
                    'We produce festivals & corporate events across Greece…',
                    'Παράγουμε φεστιβάλ & εταιρικά events σε όλη την Ελλάδα…',
                  )}
                />
              </div>
              <label
                className={`check check-agree${agree ? ' on' : ''}`}
                onClick={() => setAgree((a) => !a)}
              >
                <i />{' '}
                <span className="muted" style={{ fontSize: 13 }}>
                  {t(
                    'I agree to the Privacy Policy and GDPR handling of my application data.',
                    'Συμφωνώ με την Πολιτική Απορρήτου και τη διαχείριση GDPR των δεδομένων μου.',
                  )}
                </span>
              </label>
              {errorMsg && (
                <div
                  className="notice mt16"
                  style={{ borderColor: 'rgba(255,86,86,.35)', background: 'rgba(255,86,86,.08)' }}
                >
                  <div className="ic" style={{ color: '#ff7a7a' }}>!</div>
                  <div>{errorMsg}</div>
                </div>
              )}
              <button className="btn btn-primary btn-block mt16" type="submit" disabled={saving}>
                {saving ? t('Submitting…', 'Υποβολή…') : t('Submit application', 'Υποβολή αίτησης')}
              </button>
            </form>

            <aside className="panel">
              <h3 style={{ fontSize: 17 }}>{t('What happens next', 'Τι ακολουθεί')}</h3>
              <div
                className="flow"
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 14, marginTop: 16 }}
              >
                <div className="node blue">{t('1 · You apply', '1 · Κάνετε αίτηση')}</div>
                <div className="node">{t('2 · Admin reviews (~1 day)', '2 · Έλεγχος admin (~1 ημέρα)')}</div>
                <div className="node">{t('3 · Emailed the outcome', '3 · Ενημέρωση με email')}</div>
                <div className="node">
                  {t('4 · Pricing & booking unlocked', '4 · Ξεκλείδωμα τιμών & κρατήσεων')}
                </div>
              </div>
              <p className="muted mt24" style={{ fontSize: 13 }}>
                {t(
                  'Company-level account, tied to your VAT number for compliant B2B invoicing.',
                  'Λογαριασμός επιπέδου εταιρείας, συνδεδεμένος με το ΑΦΜ σας για συμβατή B2B τιμολόγηση.',
                )}
              </p>
            </aside>
          </div>
        ) : (
          <div className="container" style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="form center">
              <div
                className="ic"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(31,139,255,.16)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 18px',
                  color: 'var(--sky)',
                  fontSize: 28,
                  boxShadow: 'var(--glow)',
                }}
              >
                ✓
              </div>
              <div className="eyebrow center">{t('Application received', 'Η αίτηση ελήφθη')}</div>
              <h2 className="h2 mt8">{t('Pending approval', 'Σε αναμονή έγκρισης')}</h2>
              <p className="lead mt8" style={{ margin: '8px auto 0' }}>
                {t(
                  "Thanks! Our team is reviewing your details. You'll get an email once approved — usually within one business day.",
                  'Ευχαριστούμε! Η ομάδα μας ελέγχει τα στοιχεία σας. Θα λάβετε email μόλις εγκριθείτε — συνήθως εντός μίας εργάσιμης.',
                )}
              </p>
              <div className="notice mt24" style={{ textAlign: 'left' }}>
                <div className="ic">#</div>
                <div>
                  <b>
                    {t('Reference: ', 'Αριθμός: ')}
                    {reference}
                  </b>
                  <br />
                  <span className="muted" style={{ fontSize: 13.5 }}>
                    {t(
                      'Keep this for your records. Questions? Contact partners@sls.gr',
                      'Κρατήστε το για αναφορά. Ερωτήσεις; partners@sls.gr',
                    )}
                  </span>
                </div>
              </div>
              <Link className="btn btn-ghost mt24" to="/">
                {t('Back to home', 'Επιστροφή στην αρχική')}
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  )
}

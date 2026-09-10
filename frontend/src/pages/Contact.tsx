import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { useLang } from '../context/language'
import { createInquiry, type InquiryPayload } from '../lib/api'
import { Check, CircleAlert } from 'lucide-react'

const EVENT_TYPES: [string, string][] = [
  ['Concert / Festival', 'Συναυλία / Φεστιβάλ'],
  ['Brand / Experiential', 'Brand / Experiential'],
  ['Corporate / Gala', 'Εταιρικό / Γκαλά'],
  ['Wedding', 'Γάμος'],
  ['Stadium / Arena', 'Στάδιο / Αρένα'],
  ['Retail LED install', 'Εγκατάσταση LED λιανικής'],
  ['Other', 'Άλλο'],
]

const empty: InquiryPayload = {
  name: '',
  email: '',
  phone: '',
  event_type: EVENT_TYPES[0][0],
  event_date: '',
  message: '',
}

type Status = 'idle' | 'saving' | 'done' | 'error'

export default function Contact() {
  const { t, lang } = useLang()
  const [form, setForm] = useState<InquiryPayload>(empty)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [errorMsg, setErrorMsg] = useState('')

  const update = <K extends keyof InquiryPayload>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrors({})
    setErrorMsg('')
    try {
      await createInquiry(form)
      setStatus('done')
      setForm(empty)
      window.scrollTo(0, 0)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
        setStatus('idle')
      } else {
        setErrorMsg(
          t(
            'Something went wrong sending your message. Please try again.',
            'Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.',
          ),
        )
        setStatus('error')
      }
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Home / {t('Contact', 'Επικοινωνία')}</div>
          <div className="eyebrow">{t('Contact', 'Επικοινωνία')}</div>
          <h1 className="h2 mt8">{t("Let's light up your event", 'Ας φωτίσουμε την εκδήλωσή σας')}</h1>
          <p className="lead mt8">
            {t(
              'Tell us what you are planning and we will put together the right screens, lighting and sound. No payment online — we reply within one business day.',
              'Πείτε μας τι σχεδιάζετε και ετοιμάζουμε τις σωστές οθόνες, φωτισμό και ήχο. Καμία πληρωμή online — απαντάμε εντός μίας εργάσιμης.',
            )}
          </p>
        </div>
      </div>

      <section className="section-sm">
        <div className="container split">
          {status === 'done' ? (
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
                <Check size={30} aria-hidden />
              </div>
              <div className="eyebrow center">{t('Message sent', 'Το μήνυμα στάλθηκε')}</div>
              <h2 className="h2 mt8">{t('Thanks — we’ll be in touch', 'Ευχαριστούμε — θα επικοινωνήσουμε')}</h2>
              <p className="lead mt8" style={{ margin: '8px auto 0' }}>
                {t(
                  'The SLS team has your details and will reply within one business day.',
                  'Η ομάδα SLS έχει τα στοιχεία σας και θα απαντήσει εντός μίας εργάσιμης.',
                )}
              </p>
              <button className="btn btn-ghost mt24" onClick={() => setStatus('idle')}>
                {t('Send another', 'Στείλτε ξανά')}
              </button>
            </div>
          ) : (
            <form className="form" onSubmit={onSubmit} noValidate>
              <div className="row2">
                <Field label={t('Name', 'Όνομα')} error={errors.name}>
                  <input
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder={t('Your name', 'Το όνομά σας')}
                  />
                </Field>
                <Field label={t('Email', 'Email')} error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@company.com"
                  />
                </Field>
              </div>
              <div className="row2">
                <Field label={t('Phone (optional)', 'Τηλέφωνο (προαιρετικό)')} error={errors.phone}>
                  <input
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+30 210 000 0000"
                  />
                </Field>
                <Field label={t('Event date (optional)', 'Ημ/νία εκδήλωσης (προαιρετικό)')} error={errors.event_date}>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => update('event_date', e.target.value)}
                  />
                </Field>
              </div>
              <Field label={t('Event type', 'Τύπος εκδήλωσης')} error={errors.event_type}>
                <select value={form.event_type} onChange={(e) => update('event_type', e.target.value)}>
                  {EVENT_TYPES.map(([en, el]) => (
                    <option key={en} value={en}>
                      {lang === 'el' ? el : en}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('Tell us about your event', 'Πείτε μας για την εκδήλωσή σας')} error={errors.message}>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  placeholder={t(
                    'Venue, audience size, what you have in mind…',
                    'Χώρος, μέγεθος κοινού, τι έχετε στο μυαλό σας…',
                  )}
                />
              </Field>
              {errorMsg && (
                <div className="notice" style={{ borderColor: 'rgba(185, 28, 28, .35)', background: 'rgba(255,86,86,.08)' }}>
                  <div className="ic" style={{ color: 'var(--danger)' }}><CircleAlert size={18} aria-hidden /></div>
                  <div>{errorMsg}</div>
                </div>
              )}
              <button className="btn btn-primary btn-block mt16" type="submit" disabled={status === 'saving'}>
                {status === 'saving' ? t('Sending…', 'Αποστολή…') : t('Send message', 'Αποστολή μηνύματος')}
              </button>
            </form>
          )}

          <aside className="panel">
            <h3 style={{ fontSize: 17 }}>{t('Get in touch', 'Επικοινωνία')}</h3>
            <table className="spec-table">
              <tbody>
                <tr>
                  <td>Email</td>
                  <td>hello@sls.gr</td>
                </tr>
                <tr>
                  <td>{t('Sales', 'Πωλήσεις')}</td>
                  <td>sales@sls.gr</td>
                </tr>
                <tr>
                  <td>{t('Partners', 'Συνεργάτες')}</td>
                  <td>partners@sls.gr</td>
                </tr>
                <tr>
                  <td>{t('Phone', 'Τηλέφωνο')}</td>
                  <td>+30 210 000 0000</td>
                </tr>
                <tr>
                  <td>{t('Based in', 'Έδρα')}</td>
                  <td>{t('Athens, Greece', 'Αθήνα, Ελλάδα')}</td>
                </tr>
              </tbody>
            </table>
            <p className="muted mt16" style={{ fontSize: 13 }}>
              {t(
                'Prefer B2B pricing and booking? Apply for approved partner access.',
                'Θέλετε B2B τιμές και κρατήσεις; Κάντε αίτηση για εγκεκριμένη πρόσβαση.',
              )}
            </p>
          </aside>
        </div>
      </section>
    </>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error?.length ? (
        <span style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4, display: 'block' }}>
          {error[0]}
        </span>
      ) : null}
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { createInquiry, type InquiryPayload } from '../lib/api'
import AuthLayout, { Field } from '../components/AuthLayout'
import { useMainAction } from '../lib/mainAction'

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

/**
 * Contact.
 *
 * The addresses here are SLS's own. The phone number that used to sit
 * beside them — +30 210 000 0000 — was a placeholder in a real format, which
 * is worse than no number: somebody dials it.
 */
export default function Contact() {
  const { t, lang } = useLang()
  const action = useMainAction()
  const [form, setForm] = useState<InquiryPayload>(empty)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [errorMsg, setErrorMsg] = useState('')

  const update = <K extends keyof InquiryPayload>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  async function onSubmit(e: FormEvent) {
    // The kit's form script (system.js) checks the fields first and cancels
    // the submit when one fails; it shows the reason under the field.
    if (e.nativeEvent.defaultPrevented) return
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
            'That message did not send. Try again, or email hello@sls.gr.',
            'Το μήνυμα δεν στάλθηκε. Δοκιμάστε ξανά ή στείλτε email στο hello@sls.gr.',
          ),
        )
        setStatus('error')
      }
    }
  }

  return (
    <AuthLayout
      id="contact"
      title={t('Contact', 'Επικοινωνία')}
      lead={t(
        'The venue, the date and what the job has to do. Send those three and SLS comes back with a specification and a price, within one business day.',
        'Ο χώρος, η ημερομηνία και τι πρέπει να κάνει η δουλειά. Στείλτε αυτά τα τρία και η SLS επανέρχεται με προδιαγραφή και τιμή, εντός μίας εργάσιμης.',
      )}
      aside={
        <div className="stack-4">
          <p className="t-label muted">{t('Or write directly', 'Ή γράψτε απευθείας')}</p>
          <ul className="rows rows--spec">
            <li>
              <span className="rows__name">{t('Anything', 'Οτιδήποτε')}</span>
              <span className="rows__value">
                <a href="mailto:hello@sls.gr">hello@sls.gr</a>
              </span>
            </li>
            <li>
              <span className="rows__name">{t('A price or an order', 'Τιμή ή παραγγελία')}</span>
              <span className="rows__value">
                <a href="mailto:sales@sls.gr">sales@sls.gr</a>
              </span>
            </li>
            <li>
              <span className="rows__name">{t('A trade account', 'Λογαριασμός χονδρικής')}</span>
              <span className="rows__value">
                <a href="mailto:partners@sls.gr">partners@sls.gr</a>
              </span>
            </li>
            <li>
              <span className="rows__name">{t('Based in', 'Έδρα')}</span>
              <span className="rows__value">{t('Athens', 'Αθήνα')}</span>
            </li>
          </ul>
          <p className="t-small muted">
            {t(
              'Prices need an approved trade account rather than a message.',
              'Οι τιμές θέλουν εγκεκριμένο λογαριασμό χονδρικής, όχι μήνυμα.',
            )}
          </p>
          <p>
            <Link className="link" to={action.to}>
              {action.label}
            </Link>
          </p>
        </div>
      }
    >
      {status === 'done' ? (
        <div className="stack-4" role="status">
          <h2 className="t-card">{t('Sent', 'Στάλθηκε')}</h2>
          <>
            <p className="t-body">
              {t(
                'SLS has your message and your date. The reply comes to the address you gave.',
                'Η SLS έχει το μήνυμα και την ημερομηνία σας. Η απάντηση έρχεται στη διεύθυνση που δώσατε.',
              )}
            </p>
            <div className="btn-row">
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => setStatus('idle')}
              >
                {t('Send another message', 'Στείλτε άλλο μήνυμα')}
              </button>
            </div>
          </>
        </div>
      ) : (
        <form className="form" onSubmit={onSubmit} noValidate>
          <Field id="name" label={t('Name', 'Όνομα')} error={errors.name}>
            <input
              id="name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field id="email" label={t('Email', 'Email')} error={errors.email}>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field
            id="phone"
            label={t('Phone, if you prefer a call', 'Τηλέφωνο, αν προτιμάτε κλήση')}
            error={errors.phone}
          >
            <input
              id="phone"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              autoComplete="tel"
            />
          </Field>
          <Field
            id="date"
            label={t('Event date', 'Ημερομηνία εκδήλωσης')}
            error={errors.event_date}
          >
            <input
              id="date"
              type="date"
              value={form.event_date}
              onChange={(e) => update('event_date', e.target.value)}
            />
          </Field>
          <Field
            id="etype"
            label={t('Event type', 'Τύπος εκδήλωσης')}
            error={errors.event_type}
            full
          >
            <select
              id="etype"
              value={form.event_type}
              onChange={(e) => update('event_type', e.target.value)}
            >
              {EVENT_TYPES.map(([en, el]) => (
                <option key={en} value={en}>
                  {lang === 'el' ? el : en}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="msg"
            label={t(
              'The venue, the size and what it has to do',
              'Ο χώρος, το μέγεθος και τι πρέπει να κάνει',
            )}
            error={errors.message}
            full
          >
            <textarea
              id="msg"
              rows={4}
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
            />
          </Field>

          {errorMsg && <p className="form__status">{errorMsg}</p>}

          <div className="btn-row">
            <button className="btn btn--primary" type="submit" disabled={status === 'saving'}>
              {status === 'saving'
                ? t('Sending…', 'Αποστολή…')
                : t('Send the message', 'Αποστολή μηνύματος')}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}

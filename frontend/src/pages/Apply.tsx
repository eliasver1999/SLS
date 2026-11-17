import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { createPartnerApplication } from '../lib/api'
import AuthLayout, { Field } from '../components/AuthLayout'

/**
 * The trade account application — the site's main action.
 *
 * The placeholders in the fields used to be a cast of characters: Nova
 * Events Ltd, Maria Papadopoulou, maria@novaevents.gr, +30 210 000 0000.
 * Invented specifics read as real to a skim-reader, and the phone was in a
 * dialable format. The labels say what each field is; the fields are empty.
 */
const BUYS: { key: string; en: string; el: string }[] = [
  { key: 'screens', en: 'LED screens', el: 'LED οθόνες' },
  { key: 'lighting', en: 'Lighting', el: 'Φωτισμός' },
  { key: 'sound', en: 'Sound', el: 'Ήχος' },
  { key: 'packages', en: 'Stage packages', el: 'Πακέτα σκηνής' },
]

export default function Apply() {
  const { t, lang } = useLang()
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
  const [agree, setAgree] = useState(false)

  const toggle = (k: string) => setChips((c) => ({ ...c, [k]: !c[k] }))
  const set =
    (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    // The kit's form script (system.js) checks the fields first and cancels
    // the submit when one fails; it shows the reason under the field.
    if (e.nativeEvent.defaultPrevented) return
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
          t(
            'That application did not send. Try again, or email partners@sls.gr.',
            'Η αίτηση δεν στάλθηκε. Δοκιμάστε ξανά ή στείλτε email στο partners@sls.gr.',
          ),
        )
      }
    } finally {
      setSaving(false)
    }
  }

  if (pending) {
    return (
      <section className="section section--hero" data-enter aria-labelledby="done-h">
        <div className="wrap">
          <div className="hero-text">
            <div className="section-head">
              <h1 id="done-h">{t('The application is in', 'Η αίτηση καταχωρήθηκε')}</h1>
              <p>
                {t(
                  'SLS reads it and emails the outcome, usually within one business day. Approval opens every price in the catalogue.',
                  'Η SLS τη διαβάζει και στέλνει το αποτέλεσμα με email, συνήθως εντός μίας εργάσιμης. Η έγκριση ανοίγει κάθε τιμή του καταλόγου.',
                )}
              </p>
            </div>
            <ul className="rows rows--spec measure">
              <li>
                <span className="rows__name">{t('Your reference', 'Ο αριθμός σας')}</span>
                <span className="rows__value mono">{reference}</span>
              </li>
              <li>
                <span className="rows__name">{t('Questions', 'Ερωτήσεις')}</span>
                <span className="rows__value">
                  <a href="mailto:partners@sls.gr">partners@sls.gr</a>
                </span>
              </li>
            </ul>
            <div className="btn-row">
              <Link className="btn btn--secondary" to="/catalogue">
                {t('See the catalogue', 'Δείτε τον κατάλογο')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <AuthLayout
      id="apply"
      title={t('Apply for trade pricing', 'Αίτηση για τιμές χονδρικής')}
      lead={t(
        'An account is for a company with a VAT number. Once SLS approves it, every price in the catalogue is visible and the order form opens.',
        'Ο λογαριασμός είναι για εταιρεία με ΑΦΜ. Μόλις η SLS τον εγκρίνει, κάθε τιμή του καταλόγου είναι ορατή και ανοίγει η φόρμα παραγγελίας.',
      )}
      aside={
        <div className="stack-4">
          <p className="t-label muted">{t('What happens next', 'Τι ακολουθεί')}</p>
          <ul className="rows rows--spec">
            <li>
              <span className="rows__name">{t('You send this', 'Στέλνετε αυτό')}</span>
              <span className="rows__value">{t('Now', 'Τώρα')}</span>
            </li>
            <li>
              <span className="rows__name">{t('SLS reads it', 'Η SLS το διαβάζει')}</span>
              <span className="rows__value">{t('About a day', 'Περίπου μία ημέρα')}</span>
            </li>
            <li>
              <span className="rows__name">
                {t('The outcome by email', 'Το αποτέλεσμα με email')}
              </span>
              <span className="rows__value">
                {t('With a password link', 'Με σύνδεσμο κωδικού')}
              </span>
            </li>
            <li>
              <span className="rows__name">
                {t('Prices and ordering', 'Τιμές και παραγγελίες')}
              </span>
              <span className="rows__value">{t('On approval', 'Με την έγκριση')}</span>
            </li>
          </ul>
          <p className="t-small muted">
            {t(
              'The account belongs to the company and is tied to its VAT number, because that is what the invoice is made out to.',
              'Ο λογαριασμός ανήκει στην εταιρεία και συνδέεται με το ΑΦΜ της, γιατί σε αυτό εκδίδεται το τιμολόγιο.',
            )}
          </p>
          <p className="t-body">
            {t('Already have an account? ', 'Έχετε ήδη λογαριασμό; ')}
            <Link className="link" to="/login">
              {t('Sign in', 'Σύνδεση')}
            </Link>
          </p>
        </div>
      }
    >
      <form className="form" onSubmit={onSubmit}>
        <Field id="company" label={t('Company name', 'Επωνυμία εταιρείας')} error={errors.company}>
          <input
            id="company"
            value={fields.company}
            onChange={set('company')}
            autoComplete="organization"
          />
        </Field>
        <Field id="vat" label={t('VAT number', 'ΑΦΜ')} error={errors.vat}>
          <input id="vat" value={fields.vat} onChange={set('vat')} />
        </Field>
        <Field id="contact" label={t('Your name', 'Το όνομά σας')} error={errors.contact_name}>
          <input
            id="contact"
            value={fields.contact_name}
            onChange={set('contact_name')}
            autoComplete="name"
          />
        </Field>
        <Field id="role" label={t('Your role', 'Ο ρόλος σας')} error={errors.role}>
          <input
            id="role"
            value={fields.role}
            onChange={set('role')}
            autoComplete="organization-title"
          />
        </Field>
        <Field id="email" label={t('Business email', 'Επαγγελματικό email')} error={errors.email}>
          <input
            id="email"
            type="email"
            value={fields.email}
            onChange={set('email')}
            autoComplete="email"
          />
        </Field>
        <Field id="phone" label={t('Phone', 'Τηλέφωνο')} error={errors.phone}>
          <input id="phone" value={fields.phone} onChange={set('phone')} autoComplete="tel" />
        </Field>

        <div className="field field--full">
          <span className="t-label">{t('What you buy', 'Τι αγοράζετε')}</span>
          <div className="chip-row">
            {BUYS.map((b) => (
              <button
                key={b.key}
                type="button"
                className={`pill${chips[b.key] ? ' is-on' : ''}`}
                aria-pressed={!!chips[b.key]}
                onClick={() => toggle(b.key)}
              >
                {lang === 'el' ? b.el : b.en}
              </button>
            ))}
          </div>
        </div>

        <Field
          id="msg"
          label={t('What the company does', 'Τι κάνει η εταιρεία')}
          error={errors.message}
          full
        >
          <textarea id="msg" rows={3} value={fields.message} onChange={set('message')} />
        </Field>

        <div className="field field--full">
          <label htmlFor="agree" className="agree">
            <input
              id="agree"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              {t('I agree to the ', 'Συμφωνώ με την ')}
              <Link className="link link--inline" to="/privacy">
                {t('privacy policy', 'πολιτική απορρήτου')}
              </Link>
              {t(
                ' and to SLS holding these details.',
                ' και με την τήρηση αυτών των στοιχείων από τη SLS.',
              )}
            </span>
          </label>
        </div>

        {errorMsg && <p className="form__status">{errorMsg}</p>}

        <div className="btn-row">
          <button className="btn btn--primary" type="submit" disabled={saving || !agree}>
            {saving ? t('Sending…', 'Αποστολή…') : t('Send the application', 'Αποστολή αίτησης')}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { CircleAlert } from 'lucide-react'

export default function Register() {
  const { t } = useLang()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fields, setFields] = useState({ name: '', email: '', company: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [errorMsg, setErrorMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setErrorMsg('')
    try {
      await register({
        name: fields.name,
        email: fields.email,
        password: fields.password,
        company: fields.company || undefined,
      })
      // Account created — signed in as pending; the dashboard explains next steps.
      navigate('/dashboard')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
      } else {
        setErrorMsg(t('Could not create your account. Please try again.', 'Δεν ήταν δυνατή η δημιουργία λογαριασμού. Δοκιμάστε ξανά.'))
      }
    } finally {
      setBusy(false)
    }
  }

  const err = (k: string) =>
    errors[k]?.length ? (
      <span style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4, display: 'block' }}>
        {errors[k][0]}
      </span>
    ) : null

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Home / {t('Register', 'Εγγραφή')}</div>
          <div className="eyebrow">{t('Member area', 'Περιοχή μελών')}</div>
          <h1 className="h2 mt8">{t('Create an account', 'Δημιουργία λογαριασμού')}</h1>
          <p className="lead mt8">
            {t(
              'Registration is reviewed by our team. Once an admin approves your account, pricing, cart and ordering unlock.',
              'Η εγγραφή ελέγχεται από την ομάδα μας. Μόλις ένας διαχειριστής εγκρίνει τον λογαριασμό σας, ξεκλειδώνουν τιμές, καλάθι και παραγγελίες.',
            )}
          </p>
        </div>
      </div>

      <section className="section-sm">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, alignItems: 'start' }}>
          <form className="form" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label>{t('Full name', 'Ονοματεπώνυμο')}</label>
              <input value={fields.name} onChange={set('name')} placeholder="Maria Papadopoulou" autoComplete="name" />
              {err('name')}
            </div>
            <div className="field">
              <label>{t('Company', 'Εταιρεία')}</label>
              <input value={fields.company} onChange={set('company')} placeholder="Nova Events Ltd" autoComplete="organization" />
              {err('company')}
            </div>
            <div className="field">
              <label>{t('Business email', 'Επαγγελματικό email')}</label>
              <input type="email" value={fields.email} onChange={set('email')} placeholder="you@company.com" autoComplete="username" />
              {err('email')}
            </div>
            <div className="field">
              <label>{t('Password', 'Κωδικός')}</label>
              <input type="password" value={fields.password} onChange={set('password')} placeholder="••••••••" autoComplete="new-password" />
              {err('password')}
            </div>
            {errorMsg && (
              <div className="notice" style={{ borderColor: 'rgba(185, 28, 28, .35)', background: 'rgba(255,86,86,.08)' }}>
                <div className="ic" style={{ color: 'var(--danger)' }}><CircleAlert size={18} aria-hidden /></div>
                <div>{errorMsg}</div>
              </div>
            )}
            <button className="btn btn-primary btn-block mt16" type="submit" disabled={busy}>
              {busy ? t('Creating…', 'Δημιουργία…') : t('Create account', 'Δημιουργία λογαριασμού')}
            </button>
            <p className="muted mt16" style={{ fontSize: 13 }}>
              {t('Already have an account? ', 'Έχετε ήδη λογαριασμό; ')}
              <Link to="/login" style={{ color: 'var(--sky)' }}>
                {t('Sign in', 'Σύνδεση')}
              </Link>
            </p>
          </form>

          <aside className="panel">
            <h3 style={{ fontSize: 17 }}>{t('What happens next', 'Τι ακολουθεί')}</h3>
            <div className="flow" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 14, marginTop: 16 }}>
              <div className="node blue">{t('1 · You register', '1 · Εγγράφεστε')}</div>
              <div className="node">{t('2 · Admin approves your account', '2 · Ο admin εγκρίνει τον λογαριασμό')}</div>
              <div className="node">{t('3 · Pricing & cart unlocked', '3 · Ξεκλείδωμα τιμών & καλαθιού')}</div>
            </div>
            <p className="muted mt24" style={{ fontSize: 13 }}>
              {t(
                'Until approved, you can browse the full catalogue and specs — pricing and ordering stay locked.',
                'Μέχρι την έγκριση, μπορείτε να δείτε όλο τον κατάλογο και τις προδιαγραφές — τιμές και παραγγελίες παραμένουν κλειδωμένες.',
              )}
            </p>
          </aside>
        </div>
      </section>
    </>
  )
}

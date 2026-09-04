import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { CircleAlert } from 'lucide-react'

export default function Login() {
  const { t } = useLang()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login(email, password)
      navigate(u.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      if (axios.isAxiosError(err) && (err.response?.status === 422 || err.response?.status === 401)) {
        setError(t('These credentials do not match our records.', 'Τα στοιχεία δεν είναι σωστά.'))
      } else {
        setError(t('Could not sign in. Please try again.', 'Αποτυχία σύνδεσης. Δοκιμάστε ξανά.'))
      }
    } finally {
      setBusy(false)
    }
  }

  const fill = (e: string, p: string) => {
    setEmail(e)
    setPassword(p)
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Home / {t('Login', 'Σύνδεση')}</div>
          <div className="eyebrow">{t('Member area', 'Περιοχή μελών')}</div>
          <h1 className="h2 mt8">{t('Sign in', 'Σύνδεση')}</h1>
          <p className="lead mt8">
            {t(
              'Approved partners see pricing and manage bookings. Admins manage products and approvals.',
              'Οι εγκεκριμένοι συνεργάτες βλέπουν τιμές και κρατήσεις. Οι διαχειριστές διαχειρίζονται προϊόντα και εγκρίσεις.',
            )}
          </p>
        </div>
      </div>

      <section className="section-sm">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, alignItems: 'start' }}>
          <form className="form" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label>{t('Email', 'Email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label>{t('Password', 'Κωδικός')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div
                className="notice"
                style={{ borderColor: 'rgba(255,86,86,.35)', background: 'rgba(255,86,86,.08)' }}
              >
                <div className="ic" style={{ color: '#ff7a7a' }}><CircleAlert size={18} aria-hidden /></div>
                <div>{error}</div>
              </div>
            )}
            <button className="btn btn-primary btn-block mt16" type="submit" disabled={busy}>
              {busy ? t('Signing in…', 'Σύνδεση…') : t('Sign in', 'Σύνδεση')}
            </button>
            <p className="muted mt16" style={{ fontSize: 13 }}>
              <Link to="/forgot-password" style={{ color: 'var(--sky)' }}>
                {t('Forgot your password?', 'Ξεχάσατε τον κωδικό;')}
              </Link>
            </p>
            <p className="muted mt16" style={{ fontSize: 13 }}>
              {t('No account? ', 'Δεν έχετε λογαριασμό; ')}
              <Link to="/register" style={{ color: 'var(--sky)' }}>
                {t('Create one', 'Δημιουργήστε έναν')}
              </Link>
              {t(' or ', ' ή ')}
              <Link to="/apply" style={{ color: 'var(--sky)' }}>
                {t('apply for B2B access', 'κάντε αίτηση B2B πρόσβασης')}
              </Link>
            </p>
          </form>

          <aside className="panel">
            <div className="eyebrow">{t('Demo accounts', 'Λογαριασμοί demo')}</div>
            <p className="muted mt8" style={{ fontSize: 13 }}>
              {t('Click to fill, then sign in.', 'Κάντε κλικ για συμπλήρωση και συνδεθείτε.')}
            </p>
            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              <button type="button" className="node blue" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => fill('admin@sls.gr', 'password')}>
                <b>Admin</b> · admin@sls.gr / password
              </button>
              <button type="button" className="node" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => fill('maria@novaevents.gr', 'password')}>
                <b>{t('Customer', 'Πελάτης')}</b> · maria@novaevents.gr / password
              </button>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import AuthLayout, { Field } from '../components/AuthLayout'

/**
 * Sign in.
 *
 * The demo-account box used to be on this page in every build, so the
 * production sign-in page published the admin's address and password. It is
 * a development aid, and it only renders in development now.
 */
export default function Login() {
  const { t } = useLang()
  const { login } = useAuth()
  const navigate = useNavigate()
  // Arriving from a new password: say it worked, and keep the address.
  const arrived = (useLocation().state ?? {}) as {
    passwordSet?: boolean
    email?: string
  }
  const [email, setEmail] = useState(arrived.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    // The kit's form script (system.js) checks the fields first and cancels
    // the submit when one fails; it shows the reason under the field.
    if (e.nativeEvent.defaultPrevented) return
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login(email, password)
      navigate(u.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      if (
        axios.isAxiosError(err) &&
        (err.response?.status === 422 || err.response?.status === 401)
      ) {
        setError(
          t(
            'That email and password do not match an account.',
            'Το email και ο κωδικός δεν αντιστοιχούν σε λογαριασμό.',
          ),
        )
      } else {
        setError(
          t(
            'Sign-in did not go through. Try again in a moment.',
            'Η σύνδεση δεν ολοκληρώθηκε. Δοκιμάστε ξανά σε λίγο.',
          ),
        )
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      id="login"
      title={t('Sign in', 'Σύνδεση')}
      lead={t(
        'For trade accounts and the SLS team. Your orders, their invoices and the catalogue prices are on the other side.',
        'Για λογαριασμούς χονδρικής και την ομάδα της SLS. Οι παραγγελίες σας, τα τιμολόγιά τους και οι τιμές του καταλόγου είναι από την άλλη πλευρά.',
      )}
      aside={
        <p className="t-body">
          {t('No account yet? ', 'Δεν έχετε λογαριασμό; ')}
          <Link className="link" to="/apply">
            {t('Apply for trade pricing', 'Αίτηση για τιμές χονδρικής')}
          </Link>
        </p>
      }
    >
      <form className="form form--single" onSubmit={onSubmit} noValidate>
        {arrived.passwordSet && !error && (
          <p className="form__status form__status--ok" role="status">
            {t(
              'Password set. Sign in with it now.',
              'Ο κωδικός ορίστηκε. Συνδεθείτε τώρα με αυτόν.',
            )}
          </p>
        )}
        <Field id="email" label={t('Email', 'Email')}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </Field>
        <Field id="password" label={t('Password', 'Κωδικός')}>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>

        {error && (
          <p className="form__status" role="alert">
            {error}
          </p>
        )}

        <div className="btn-row">
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? t('Signing in…', 'Σύνδεση…') : t('Sign in', 'Σύνδεση')}
          </button>
          <Link className="link" to="/forgot-password">
            {t('Forgotten password', 'Ξέχασα τον κωδικό')}
          </Link>
        </div>

        {import.meta.env.DEV && (
          <div className="dev-accounts">
            <p className="t-label muted">
              {t('Development only: seeded accounts', 'Μόνο για ανάπτυξη: λογαριασμοί δοκιμής')}
            </p>
            <div className="chip-row">
              <button
                type="button"
                className="pill"
                onClick={() => {
                  setEmail('admin@sls.gr')
                  setPassword('password')
                }}
              >
                Admin · admin@sls.gr
              </button>
              <button
                type="button"
                className="pill"
                onClick={() => {
                  setEmail('maria@novaevents.gr')
                  setPassword('password')
                }}
              >
                {t('Customer', 'Πελάτης')} · maria@novaevents.gr
              </button>
            </div>
          </div>
        )}
      </form>
    </AuthLayout>
  )
}

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { forgotPassword } from '../lib/api'

export default function ForgotPassword() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch {
      // Still show the generic confirmation — we never reveal if an email exists.
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Home / {t('Reset password', 'Επαναφορά κωδικού')}</div>
          <div className="eyebrow">{t('Member area', 'Περιοχή μελών')}</div>
          <h1 className="h2 mt8">{t('Forgot your password?', 'Ξεχάσατε τον κωδικό;')}</h1>
          <p className="lead mt8">
            {t(
              "Enter your email and we'll send a link to reset your password.",
              'Δώστε το email σας και θα σας στείλουμε σύνδεσμο επαναφοράς.',
            )}
          </p>
        </div>
      </div>

      <section className="section-sm">
        <div className="container" style={{ maxWidth: 460 }}>
          {sent ? (
            <div className="notice" style={{ borderColor: 'rgba(72,211,138,.35)', background: 'rgba(72,211,138,.08)' }}>
              <div className="ic" style={{ color: '#48d38a' }}>✓</div>
              <div>
                {t(
                  'If that email has an account, a reset link is on its way. Check your inbox.',
                  'Αν υπάρχει λογαριασμός με αυτό το email, ο σύνδεσμος επαναφοράς στάλθηκε. Ελέγξτε το inbox σας.',
                )}
              </div>
            </div>
          ) : (
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
              <button className="btn btn-primary btn-block mt16" type="submit" disabled={busy}>
                {busy ? t('Sending…', 'Αποστολή…') : t('Send reset link', 'Αποστολή συνδέσμου')}
              </button>
            </form>
          )}
          <p className="muted mt16" style={{ fontSize: 13 }}>
            <Link to="/login" style={{ color: 'var(--sky)' }}>
              {t('← Back to sign in', '← Πίσω στη σύνδεση')}
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}

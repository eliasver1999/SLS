import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../context/language'
import { resetPassword } from '../lib/api'
import { CircleAlert } from 'lucide-react'

export default function ResetPassword() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const emailFromLink = params.get('email') ?? ''

  const [email, setEmail] = useState(emailFromLink)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const invalidLink = !token || !emailFromLink

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(t('Passwords do not match.', 'Οι κωδικοί δεν ταιριάζουν.'))
      return
    }
    setBusy(true)
    try {
      await resetPassword({ token, email, password, password_confirmation: confirm })
      navigate('/login', { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const errors = err.response.data?.errors as Record<string, string[]> | undefined
        const first = errors ? Object.values(errors)[0]?.[0] : undefined
        setError(first ?? t('This reset link is invalid or has expired.', 'Ο σύνδεσμος είναι άκυρος ή έληξε.'))
      } else {
        setError(t('Could not reset your password. Please try again.', 'Αποτυχία επαναφοράς. Δοκιμάστε ξανά.'))
      }
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
          <h1 className="h2 mt8">{t('Choose a new password', 'Επιλέξτε νέο κωδικό')}</h1>
        </div>
      </div>

      <section className="section-sm">
        <div className="container" style={{ maxWidth: 460 }}>
          {invalidLink ? (
            <div className="notice" style={{ borderColor: 'rgba(255,86,86,.35)', background: 'rgba(255,86,86,.08)' }}>
              <div className="ic" style={{ color: '#ff7a7a' }}><CircleAlert size={18} aria-hidden /></div>
              <div>
                {t(
                  'This reset link is missing or invalid. Please request a new one.',
                  'Ο σύνδεσμος επαναφοράς λείπει ή είναι άκυρος. Ζητήστε νέον.',
                )}
                <div className="mt8">
                  <Link className="btn btn-primary btn-sm" to="/forgot-password">
                    {t('Request a new link', 'Νέος σύνδεσμος')}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form className="form" onSubmit={onSubmit} noValidate>
              <div className="field">
                <label>{t('Email', 'Email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
              </div>
              <div className="field">
                <label>{t('New password', 'Νέος κωδικός')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label>{t('Confirm password', 'Επιβεβαίωση κωδικού')}</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <div className="notice" style={{ borderColor: 'rgba(255,86,86,.35)', background: 'rgba(255,86,86,.08)' }}>
                  <div className="ic" style={{ color: '#ff7a7a' }}><CircleAlert size={18} aria-hidden /></div>
                  <div>{error}</div>
                </div>
              )}
              <button className="btn btn-primary btn-block mt16" type="submit" disabled={busy}>
                {busy ? t('Resetting…', 'Επαναφορά…') : t('Reset password', 'Επαναφορά κωδικού')}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CircleAlert, CircleCheck } from 'lucide-react'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { useApplyTheme } from '../context/theme'
import { changePassword, updateProfile } from '../lib/api'
import { errorMessage } from '../lib/errors'

/**
 * A member maintains their own company details and password.
 *
 * Email is deliberately absent: changing a sign-in address is an identity
 * change that should be verified before it is trusted, so it stays a
 * conversation with the team rather than a form field.
 */
export default function Profile() {
  const { t } = useLang()
  const { user, setUser } = useAuth()
  useApplyTheme()

  const [name, setName] = useState(user?.name ?? '')
  const [company, setCompany] = useState(user?.company ?? '')
  const [vat, setVat] = useState(user?.vat_number ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwDone, setPwDone] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)

  const dirty =
    name !== (user?.name ?? '') ||
    company !== (user?.company ?? '') ||
    vat !== (user?.vat_number ?? '')

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const updated = await updateProfile({
        name: name.trim(),
        company: company.trim() || null,
        vat_number: vat.trim() || null,
      })
      setUser(updated)
      setSaved(true)
    } catch (e) {
      setError(errorMessage(e, t('Could not save your details.', 'Αδυναμία αποθήκευσης.')))
    } finally {
      setSaving(false)
    }
  }

  async function savePassword() {
    setPwBusy(true)
    setPwDone(null)
    setPwError(null)
    try {
      setPwDone(
        await changePassword({
          current_password: current,
          password: next,
          password_confirmation: confirm,
        }),
      )
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (e) {
      setPwError(errorMessage(e, t('Could not change your password.', 'Αδυναμία αλλαγής κωδικού.')))
    } finally {
      setPwBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">
            Home / {t('Dashboard', 'Πίνακας')} / {t('Company profile', 'Προφίλ εταιρείας')}
          </div>
          <div className="eyebrow">{t('Account', 'Λογαριασμός')}</div>
          <h1 className="h2 mt8">{t('Company profile', 'Προφίλ εταιρείας')}</h1>
          <p className="muted mt8">
            {t(
              'These details appear on your quotes, orders and invoices — keep them current so we bill the right entity.',
              'Τα στοιχεία αυτά εμφανίζονται σε προσφορές, παραγγελίες και τιμολόγια.',
            )}
          </p>
        </div>
      </div>

      <section className="section-sm">
        <div className="container" style={{ maxWidth: 560 }}>
          <div className="panel">
            <div className="field">
              <label>{t('Contact name', 'Όνομα επαφής')}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="field mt16">
              <label>{t('Company', 'Εταιρεία')}</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t('Registered company name', 'Επωνυμία εταιρείας')}
              />
            </div>

            <div className="field mt16">
              <label>{t('VAT number', 'ΑΦΜ')}</label>
              <input
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                placeholder="EL123456789"
              />
              <p className="muted mt8" style={{ fontSize: 12.5 }}>
                {t(
                  'Required on a B2B invoice. We copy it onto each order as it is placed.',
                  'Απαιτείται σε τιμολόγιο B2B. Αντιγράφεται σε κάθε παραγγελία.',
                )}
              </p>
            </div>

            <div className="field mt16">
              <label>{t('Email', 'Email')}</label>
              <input value={user?.email ?? ''} disabled style={{ opacity: 0.6 }} />
              <p className="muted mt8" style={{ fontSize: 12.5 }}>
                {t(
                  'Your sign-in address cannot be changed here — contact us if it needs to move.',
                  'Η διεύθυνση σύνδεσης δεν αλλάζει εδώ — επικοινωνήστε μαζί μας.',
                )}
              </p>
            </div>

            <button
              className="btn btn-primary btn-block mt24"
              onClick={save}
              disabled={saving || !dirty || name.trim() === ''}
            >
              {saving ? t('Saving…', 'Αποθήκευση…') : t('Save changes', 'Αποθήκευση')}
            </button>

            {saved && !dirty && (
              <p style={{ color: 'var(--ok)', fontSize: 13, marginTop: 12 }}>
                <CircleCheck size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
                {t('Saved.', 'Αποθηκεύτηκε.')}
              </p>
            )}

            {error && (
              <div
                className="notice mt16"
                style={{ borderColor: 'rgba(185,28,28,.35)', background: 'rgba(185,28,28,.08)' }}
              >
                <div className="ic" style={{ color: 'var(--danger)' }}>
                  <CircleAlert size={18} aria-hidden />
                </div>
                <div>{error}</div>
              </div>
            )}
          </div>

          {/* Changing a password asks for the current one even though the
              session is already authenticated — a leaked token must not be
              enough to lock the owner out. Doing so also signs out every
              other device. */}
          <div className="panel mt24">
            <h3 style={{ fontSize: 16 }}>{t('Password', 'Κωδικός')}</h3>
            <p className="muted mt8" style={{ fontSize: 12.5 }}>
              {t(
                'Changing it signs you out everywhere else.',
                'Η αλλαγή αποσυνδέει τις άλλες συσκευές.',
              )}
            </p>

            <div className="field mt16">
              <label>{t('Current password', 'Τρέχων κωδικός')}</label>
              <input
                type="password"
                value={current}
                autoComplete="current-password"
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div className="field mt16">
              <label>{t('New password', 'Νέος κωδικός')}</label>
              <input
                type="password"
                value={next}
                autoComplete="new-password"
                onChange={(e) => setNext(e.target.value)}
              />
            </div>
            <div className="field mt16">
              <label>{t('Confirm new password', 'Επιβεβαίωση')}</label>
              <input
                type="password"
                value={confirm}
                autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            <button
              className="btn btn-ghost btn-block mt24"
              onClick={savePassword}
              disabled={pwBusy || !current || next.length < 8 || !confirm}
            >
              {pwBusy ? t('Changing…', 'Αλλαγή…') : t('Change password', 'Αλλαγή κωδικού')}
            </button>

            {pwDone && (
              <p style={{ color: 'var(--ok)', fontSize: 13, marginTop: 12 }}>
                <CircleCheck size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
                {pwDone}
              </p>
            )}
            {pwError && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{pwError}</p>
            )}
          </div>

          <Link className="btn btn-ghost btn-sm mt24" to="/dashboard">
            <ArrowLeft size={14} aria-hidden />
            {t('Back to dashboard', 'Πίσω στον πίνακα')}
          </Link>
        </div>
      </section>
    </>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CircleAlert, CircleCheck } from 'lucide-react'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { useApplyTheme } from '../context/theme'
import { updateProfile } from '../lib/api'
import { errorMessage } from '../lib/errors'

/**
 * A member maintains their own company details.
 *
 * Email and password are deliberately absent: changing an email is an
 * identity change that needs verifying before it is trusted, and the
 * password already has its own reset flow.
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

          <Link className="btn btn-ghost btn-sm mt24" to="/dashboard">
            <ArrowLeft size={14} aria-hidden />
            {t('Back to dashboard', 'Πίσω στον πίνακα')}
          </Link>
        </div>
      </section>
    </>
  )
}

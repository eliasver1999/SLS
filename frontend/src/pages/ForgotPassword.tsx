import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { forgotPassword } from '../lib/api'
import AuthLayout, { Field } from '../components/AuthLayout'

export default function ForgotPassword() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    // The kit's form script (system.js) checks the fields first and cancels
    // the submit when one fails; it shows the reason under the field.
    if (e.nativeEvent.defaultPrevented) return
    e.preventDefault()
    setBusy(true)
    try {
      await forgotPassword(email)
    } catch {
      // The same answer either way: the page never says whether an address
      // has an account.
    } finally {
      setSent(true)
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      id="forgot"
      title={t('Forgotten password', 'Ξέχασα τον κωδικό')}
      lead={t(
        'Give the email the account uses. A link to set a new password goes to it, and works for an hour.',
        'Δώστε το email του λογαριασμού. Ένας σύνδεσμος για νέο κωδικό πηγαίνει εκεί και ισχύει για μία ώρα.',
      )}
      aside={
        <p className="t-body">
          <Link className="link" to="/login">
            {t('Back to sign in', 'Πίσω στη σύνδεση')}
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="stack-4" role="status">
          <h2 className="t-card">{t('Check the inbox', 'Ελέγξτε τα εισερχόμενα')}</h2>
          <p className="t-body">
            {t(
              'If that address has an account, the link is on its way. Nothing arrives if it does not.',
              'Αν η διεύθυνση έχει λογαριασμό, ο σύνδεσμος στάλθηκε. Αν δεν έχει, δεν θα έρθει τίποτα.',
            )}
          </p>
        </div>
      ) : (
        <form className="form form--single" onSubmit={onSubmit} noValidate>
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
          <div className="btn-row">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? t('Sending…', 'Αποστολή…') : t('Send the link', 'Αποστολή συνδέσμου')}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}

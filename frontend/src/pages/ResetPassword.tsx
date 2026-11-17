import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../context/language'
import { resetPassword } from '../lib/api'
import AuthLayout, { Field } from '../components/AuthLayout'

/**
 * Set a password from an emailed link. Two kinds of email lead here: a
 * forgotten-password reset, and the approval email that sets a new
 * partner's first password — so the page says "set", which is true of both.
 */
export default function ResetPassword() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const emailFromLink = params.get('email') ?? ''
  // Set by the approval email's link, whose token lasts a week.
  const invite = params.get('invite') === '1'

  const [email, setEmail] = useState(emailFromLink)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)
  const [busy, setBusy] = useState(false)

  const invalidLink = !token || !emailFromLink

  async function onSubmit(e: FormEvent) {
    // The kit's form script (system.js) checks the fields first and cancels
    // the submit when one fails; it shows the reason under the field.
    if (e.nativeEvent.defaultPrevented) return
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(t('The two passwords are not the same.', 'Οι δύο κωδικοί δεν είναι ίδιοι.'))
      return
    }
    setBusy(true)
    try {
      await resetPassword({
        token,
        email,
        password,
        password_confirmation: confirm,
        invite,
      })
      // Say so on the sign-in page, rather than landing there with no word
      // on whether it worked.
      navigate('/login', {
        replace: true,
        state: { passwordSet: true, email },
      })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const errors = err.response.data?.errors as Record<string, string[]> | undefined
        // A token error means the link is spent or out of date; a password
        // error is something the person can fix in the form.
        if (errors?.email && !errors.password) setExpired(true)
        else setError(errors ? (Object.values(errors)[0]?.[0] ?? '') : '')
      } else {
        setError(
          t(
            'The password was not set. Try again in a moment.',
            'Ο κωδικός δεν ορίστηκε. Δοκιμάστε ξανά σε λίγο.',
          ),
        )
      }
    } finally {
      setBusy(false)
    }
  }

  const deadLink = invalidLink || expired

  return (
    <AuthLayout
      id="reset"
      title={t('Set a password', 'Ορισμός κωδικού')}
      lead={
        deadLink
          ? invite
            ? t(
                'This link has expired or was already used: a first-password link lasts a week. A new one takes a moment.',
                'Ο σύνδεσμος έληξε ή έχει ήδη χρησιμοποιηθεί: ένας σύνδεσμος πρώτου κωδικού ισχύει μία εβδομάδα. Ένας νέος παίρνει ένα λεπτό.',
              )
            : t(
                'This link has expired or was already used: a reset link lasts an hour. A new one takes a moment.',
                'Ο σύνδεσμος έληξε ή έχει ήδη χρησιμοποιηθεί: ένας σύνδεσμος επαναφοράς ισχύει μία ώρα. Ένας νέος παίρνει ένα λεπτό.',
              )
          : t(
              'At least eight characters. You sign in with it straight after.',
              'Τουλάχιστον οκτώ χαρακτήρες. Συνδέεστε με αυτόν αμέσως μετά.',
            )
      }
    >
      {deadLink ? (
        <div className="btn-row">
          <Link className="btn btn--primary" to="/forgot-password">
            {t('Send a new link', 'Νέος σύνδεσμος')}
          </Link>
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
            />
          </Field>
          <Field id="password" label={t('New password', 'Νέος κωδικός')}>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </Field>
          <Field id="confirm" label={t('The same again', 'Ξανά ο ίδιος')}>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <p className="form__status" role="alert">
              {error}
            </p>
          )}

          <div className="btn-row">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? t('Saving…', 'Αποθήκευση…') : t('Set the password', 'Ορισμός κωδικού')}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}

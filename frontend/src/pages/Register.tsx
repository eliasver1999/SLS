import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import AuthLayout, { Field } from '../components/AuthLayout'

/**
 * Create an account. It starts pending: the catalogue's figures are open,
 * its prices and the order form open when SLS approves the account.
 */
export default function Register() {
  const { t } = useLang()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fields, setFields] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [errorMsg, setErrorMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    // The kit's form script (system.js) checks the fields first and cancels
    // the submit when one fails; it shows the reason under the field.
    if (e.nativeEvent.defaultPrevented) return
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
      // Signed in as pending; the dashboard says what happens next.
      navigate('/dashboard')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
      } else {
        setErrorMsg(
          t(
            'The account was not created. Try again in a moment.',
            'Ο λογαριασμός δεν δημιουργήθηκε. Δοκιμάστε ξανά σε λίγο.',
          ),
        )
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      id="register"
      title={t('Create an account', 'Δημιουργία λογαριασμού')}
      lead={t(
        'The account starts pending. SLS reviews it, usually within one business day; approval opens the prices and the order form.',
        'Ο λογαριασμός ξεκινά σε αναμονή. Η SLS τον ελέγχει, συνήθως εντός μίας εργάσιμης· η έγκριση ανοίγει τις τιμές και τη φόρμα παραγγελίας.',
      )}
      aside={
        <p className="t-body">
          {t('Already have one? ', 'Έχετε ήδη; ')}
          <Link className="link" to="/login">
            {t('Sign in', 'Σύνδεση')}
          </Link>
        </p>
      }
    >
      <form className="form" onSubmit={onSubmit} noValidate>
        <Field id="name" label={t('Your name', 'Το όνομά σας')} error={errors.name}>
          <input id="name" value={fields.name} onChange={set('name')} autoComplete="name" />
        </Field>
        <Field id="company" label={t('Company', 'Εταιρεία')} error={errors.company}>
          <input
            id="company"
            value={fields.company}
            onChange={set('company')}
            autoComplete="organization"
          />
        </Field>
        <Field
          id="email"
          label={t('Business email', 'Επαγγελματικό email')}
          error={errors.email}
          full
        >
          <input
            id="email"
            type="email"
            value={fields.email}
            onChange={set('email')}
            autoComplete="username"
          />
        </Field>
        <Field id="password" label={t('Password', 'Κωδικός')} error={errors.password} full>
          <input
            id="password"
            type="password"
            value={fields.password}
            onChange={set('password')}
            autoComplete="new-password"
          />
        </Field>

        {errorMsg && (
          <p className="form__status" role="alert">
            {errorMsg}
          </p>
        )}

        <div className="btn-row">
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy
              ? t('Creating…', 'Δημιουργία…')
              : t('Create the account', 'Δημιουργία λογαριασμού')}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

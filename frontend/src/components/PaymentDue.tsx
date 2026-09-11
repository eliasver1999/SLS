import { Landmark } from 'lucide-react'
import { useLang } from '../context/language'
import type { OrderPayment } from '../lib/api'

/**
 * What to pay now, and where to send it.
 *
 * Accepting an order emails a deposit request; completing it emails the
 * balance. The order page used to say neither, so the email was the only
 * place the amount and the payment reference existed — and an email is
 * precisely the thing someone cannot find again three weeks later.
 *
 * The figures come from the API, which derives them the same way the emails
 * do, so the page and the email cannot quote different amounts.
 *
 * It deliberately does not claim anything has been paid: nothing in the
 * system watches the bank account, so it states what is due and stops.
 */
export default function PaymentDue({ payment }: { payment: OrderPayment }) {
  const { t } = useLang()
  const isDeposit = payment.due === 'deposit'

  const amount = isDeposit ? payment.deposit : payment.balance

  return (
    <div
      className="notice mt24"
      style={{
        borderColor: 'var(--sky)',
        background: 'var(--info-bg)',
        alignItems: 'flex-start',
        display: 'block',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Landmark size={17} aria-hidden style={{ color: 'var(--sky)' }} />
        <b style={{ fontSize: 14 }}>
          {isDeposit
            ? t(
                `${payment.deposit_percent}% deposit due`,
                `Προκαταβολή ${payment.deposit_percent}%`,
              )
            : t('Balance due', 'Υπόλοιπο προς πληρωμή')}
        </b>
      </div>

      <div
        style={{
          fontFamily: 'var(--head)',
          fontSize: 30,
          fontWeight: 700,
          margin: '10px 0 2px',
        }}
      >
        {amount}
      </div>
      <p className="muted" style={{ fontSize: 12.5 }}>
        {isDeposit
          ? t(
              `This starts production. The remaining ${payment.balance} is due once the job is complete.`,
              `Ξεκινά η παραγωγή. Το υπόλοιπο ${payment.balance} οφείλεται με την ολοκλήρωση.`,
            )
          : t(
              'The deposit has already been invoiced. If you have paid this, ignore it.',
              'Η προκαταβολή έχει ήδη τιμολογηθεί. Αν το έχετε πληρώσει, αγνοήστε το.',
            )}
      </p>

      {/* The reference first: a transfer without it is a payment the team
          cannot match to a job. */}
      <dl className="pay-lines mt16">
        <dt>{t('Payment reference', 'Αιτιολογία')}</dt>
        <dd>
          <b>{payment.reference}</b>
        </dd>

        <dt>IBAN</dt>
        <dd style={{ letterSpacing: '0.02em' }}>
          <b>{payment.iban}</b>
        </dd>

        <dt>{t('Account', 'Δικαιούχος')}</dt>
        <dd>{payment.account_name}</dd>

        <dt>{t('Bank', 'Τράπεζα')}</dt>
        <dd>{payment.bank_name}</dd>
      </dl>
    </div>
  )
}

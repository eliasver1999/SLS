import { Fragment } from 'react'
import { CircleCheck, Landmark } from 'lucide-react'
import { useLang } from '../context/language'
import type { OrderPayment } from '../lib/api'

/**
 * What has been paid, what is left, and where to send it.
 *
 * Accepting an order emails a deposit request; completing it emails the
 * balance. The order page used to say neither, so the email was the only
 * place the amount and the payment reference existed — and an email is
 * precisely the thing someone cannot find again three weeks later.
 *
 * Everything here is derived server-side from the payments the team has
 * recorded, so this and the emails cannot quote different figures, and
 * neither asks for money that has already arrived.
 */
export default function PaymentDue({ payment }: { payment: OrderPayment }) {
  const { t, lang } = useLang()

  const date = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : ''

  const receipts = payment.received.length > 0 && (
    <dl className="pay-lines mt16">
      {payment.received.map((r) => (
        <Fragment key={r.id}>
          <dt>{t('Received', 'Ελήφθη')}</dt>
          <dd>
            {r.amount}
            <span className="muted" style={{ fontSize: 12 }}>
              {' · '}
              {date(r.received_on)}
            </span>
          </dd>
        </Fragment>
      ))}
    </dl>
  )

  // Paid in full: say so and stop. Repeating the bank details under a
  // settled balance is how a customer ends up paying twice.
  if (payment.settled) {
    return (
      <div
        className="notice mt24"
        style={{
          borderColor: 'var(--ok)',
          background: 'var(--ok-bg)',
          alignItems: 'flex-start',
          display: 'block',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CircleCheck size={17} aria-hidden style={{ color: 'var(--ok)' }} />
          <b style={{ fontSize: 14 }}>{t('Paid in full', 'Εξοφλήθη')}</b>
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
          {t('Nothing further is due on this order. Thank you.', 'Δεν οφείλεται τίποτα άλλο. Ευχαριστούμε.')}
        </p>
        {receipts}
      </div>
    )
  }

  // Deposit paid, job not finished: nothing is due *now*, but money has
  // arrived and a balance is coming. Showing nothing here was worse than
  // useless — it let the "no payment is taken online" line reappear under
  // an order the customer had already part paid.
  if (!payment.due) {
    return (
      <div
        className="notice mt24"
        style={{
          borderColor: 'var(--line)',
          background: 'var(--surface-sunken)',
          alignItems: 'flex-start',
          display: 'block',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CircleCheck size={17} aria-hidden style={{ color: 'var(--ok)' }} />
          <b style={{ fontSize: 14 }}>{t('Deposit received', 'Ελήφθη προκαταβολή')}</b>
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
          {t(
            `${payment.paid} received. The remaining ${payment.outstanding} falls due when the job is complete — we will email you then.`,
            `Ελήφθησαν ${payment.paid}. Το υπόλοιπο ${payment.outstanding} οφείλεται με την ολοκλήρωση.`,
          )}
        </p>
        {receipts}
      </div>
    )
  }

  const isDeposit = payment.due === 'deposit'
  const partPaid = payment.paid_cents > 0

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

      {/* The amount still to send, not the nominal instalment — someone who
          has part paid should not be asked for the whole thing again. */}
      <div
        style={{
          fontFamily: 'var(--head)',
          fontSize: 30,
          fontWeight: 700,
          margin: '10px 0 2px',
        }}
      >
        {payment.due_amount}
      </div>
      <p className="muted" style={{ fontSize: 12.5 }}>
        {partPaid
          ? t(
              `${payment.paid} received so far, ${payment.outstanding} outstanding on this order.`,
              `${payment.paid} ελήφθησαν, ${payment.outstanding} υπόλοιπο.`,
            )
          : isDeposit
            ? t(
                `This starts production. The remaining ${payment.balance} is due once the job is complete.`,
                `Ξεκινά η παραγωγή. Το υπόλοιπο ${payment.balance} οφείλεται με την ολοκλήρωση.`,
              )
            : t('Due now that the job is complete.', 'Οφείλεται με την ολοκλήρωση.')}
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

      {receipts}
    </div>
  )
}

import { useState } from 'react'
import { Landmark, Trash2 } from 'lucide-react'
import { useLang } from '../context/language'
import { deletePayment, recordPayment, type Order } from '../lib/api'
import { errorMessage } from '../lib/errors'
import { inputToCents } from '../lib/money'

/**
 * The team writing down money that arrived in the bank.
 *
 * Nothing here takes a payment. These rows are what let the application
 * stop guessing: before them the completion email asked every customer for
 * the balance, including the ones who had already paid in full.
 *
 * The amount is pre-filled with whatever is currently due, because the
 * common case by a distance is "the expected amount landed" — and typing a
 * figure by hand is how you record 4,278 against a 42,780 deposit.
 */
export default function OrderPayments({
  order,
  onChange,
}: {
  order: Order
  onChange: (order: Order) => void
}) {
  const { t, lang } = useLang()
  const payment = order.payment

  const [amount, setAmount] = useState('')
  const [receivedOn, setReceivedOn] = useState(new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggested = payment.due_cents > 0 ? payment.due_cents : payment.outstanding_cents
  const cents = inputToCents(amount) ?? suggested

  const date = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : ''

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      onChange(
        await recordPayment(order.id, {
          amount_cents: cents,
          received_on: receivedOn,
          reference: reference.trim() || undefined,
        }),
      )
      setAmount('')
      setReference('')
    } catch (e) {
      setError(errorMessage(e, t('Could not record that payment.', 'Αδυναμία καταχώρησης.')))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    setError(null)
    try {
      onChange(await deletePayment(order.id, id))
    } catch (e) {
      setError(errorMessage(e, t('Could not remove that payment.', 'Αδυναμία διαγραφής.')))
    }
  }

  const input: React.CSSProperties = {
    background: 'var(--input-bg)',
    border: '1px solid var(--line)',
    borderRadius: 8,
    color: 'var(--text)',
    padding: '9px 10px',
    fontSize: 13,
    width: '100%',
  }

  return (
    <div className="mt24">
      <h4 style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-soft)' }}>
        {t('Payments', 'Πληρωμές')}
      </h4>

      <div
        className="panel mt8"
        style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12 }}
      >
        <div>
          <div className="muted" style={{ fontSize: 12 }}>{t('Received', 'Ελήφθη')}</div>
          <b>{payment.paid}</b>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="muted" style={{ fontSize: 12 }}>{t('Outstanding', 'Υπόλοιπο')}</div>
          <b style={{ color: payment.settled ? 'var(--ok)' : 'var(--warn)' }}>{payment.outstanding}</b>
        </div>
      </div>

      {payment.received.length > 0 && (
        <div className="mt8">
          {payment.received.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 12.5,
                padding: '7px 2px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <Landmark size={13} aria-hidden style={{ color: 'var(--ok)', flex: 'none' }} />
              <b>{r.amount}</b>
              <span className="muted">{date(r.received_on)}</span>
              {r.reference && <span className="muted">· {r.reference}</span>}
              {/* No edit: correcting an amount is a delete and a re-entry,
                  which keeps the log honest about what was believed when. */}
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto', padding: '4px 8px' }}
                onClick={() => remove(r.id)}
                title={t('Remove this record', 'Διαγραφή')}
              >
                <Trash2 size={12} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {!payment.settled && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          <input
            style={input}
            value={amount}
            inputMode="decimal"
            placeholder={payment.due_amount ?? t('Amount', 'Ποσό')}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            style={input}
            type="date"
            value={receivedOn}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setReceivedOn(e.target.value)}
          />
          <input
            style={{ ...input, gridColumn: '1 / -1' }}
            value={reference}
            placeholder={t('Bank reference (optional)', 'Αναφορά τράπεζας (προαιρετικό)')}
            onChange={(e) => setReference(e.target.value)}
          />
          <button
            className="btn btn-ghost btn-sm"
            style={{ gridColumn: '1 / -1' }}
            onClick={submit}
            disabled={busy || cents === 0}
          >
            {busy
              ? t('Recording…', 'Καταχώρηση…')
              : t('Record payment received', 'Καταχώρηση πληρωμής')}
          </button>
        </div>
      )}

      {error && <p style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 8 }}>{error}</p>}
    </div>
  )
}

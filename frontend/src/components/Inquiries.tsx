import { Fragment, useCallback, useEffect, useState } from 'react'
import { Mail, Phone } from 'lucide-react'
import { useLang } from '../context/language'
import {
  fetchInquiries,
  updateInquiry,
  type Inquiry,
  type InquiryCounts,
  type InquiryStatus,
} from '../lib/api'

/**
 * Admin inbox for contact-form enquiries. Sales also gets an email per
 * submission, but this is the record — an enquiry is not lost just because
 * nobody was watching the inbox.
 */
export default function Inquiries() {
  const { t, lang } = useLang()
  const [items, setItems] = useState<Inquiry[]>([])
  const [counts, setCounts] = useState<InquiryCounts>({ new: 0, handled: 0 })
  const [filter, setFilter] = useState<InquiryStatus | 'all'>('all')
  const [open, setOpen] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetchInquiries(filter === 'all' ? undefined : { status: filter })
      setItems(res.items)
      setCounts(res.counts)
      setError(null)
    } catch {
      setError(t('Could not load enquiries.', 'Αδυναμία φόρτωσης αιτημάτων.'))
    }
  }, [filter, t])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(inquiry: Inquiry, status: InquiryStatus) {
    try {
      await updateInquiry(inquiry.id, status)
      await load()
    } catch {
      setError(t('Could not update that enquiry.', 'Αδυναμία ενημέρωσης.'))
    }
  }

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const tabs: { key: InquiryStatus | 'all'; label: string }[] = [
    { key: 'all', label: t('All', 'Όλα') },
    { key: 'new', label: t('New', 'Νέα') },
    { key: 'handled', label: t('Handled', 'Διεκπεραιωμένα') },
  ]

  return (
    <>
      <h1 className="h2" style={{ fontSize: 26 }}>
        {t('Enquiries', 'Αιτήματα')}
      </h1>
      <p className="muted">
        {t(
          'Messages from the contact form. Sales is emailed on each submission — mark one handled once you have replied.',
          'Μηνύματα από τη φόρμα επικοινωνίας. Το τμήμα πωλήσεων ενημερώνεται με email σε κάθε υποβολή.',
        )}
      </p>

      <div className="kpis mt24">
        <div className="kpi">
          <div className="n" style={{ color: '#ffce54' }}>
            {counts.new}
          </div>
          <div className="l">{t('New', 'Νέα')}</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ color: '#48d38a' }}>
            {counts.handled}
          </div>
          <div className="l">{t('Handled', 'Διεκπεραιωμένα')}</div>
        </div>
      </div>

      <div className="mt24" style={{ display: 'flex', gap: 8 }}>
        {tabs.map((tab) => (
          <span
            key={tab.key}
            className={`chip${filter === tab.key ? ' on' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </span>
        ))}
      </div>

      {error && (
        <p style={{ color: '#ff7a7a', fontSize: 13, marginTop: 12 }}>{error}</p>
      )}

      <table className="tbl mt16">
        <tbody>
          <tr>
            <th>{t('Received', 'Ελήφθη')}</th>
            <th>{t('From', 'Από')}</th>
            <th>{t('Event', 'Εκδήλωση')}</th>
            <th>{t('Status', 'Κατάσταση')}</th>
            <th>{t('Action', 'Ενέργεια')}</th>
          </tr>

          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                {t('No enquiries yet.', 'Κανένα αίτημα ακόμη.')}
              </td>
            </tr>
          )}

          {items.map((inq) => (
            <Fragment key={inq.id}>
              <tr
                onClick={() => setOpen(open === inq.id ? null : inq.id)}
                style={{ cursor: 'pointer' }}
              >
                <td>{date(inq.created_at)}</td>
                <td>
                  <b>{inq.name}</b>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {inq.email}
                  </div>
                </td>
                <td>
                  {inq.event_type}
                  {inq.event_date && (
                    <div className="muted" style={{ fontSize: 12 }}>
                      {date(inq.event_date)}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`status ${inq.status === 'new' ? 'wait' : 'ok'}`}>
                    {inq.status === 'new' ? t('New', 'Νέο') : t('Handled', 'Διεκπεραιωμένο')}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setStatus(inq, inq.status === 'new' ? 'handled' : 'new')
                    }}
                  >
                    {inq.status === 'new' ? t('Mark handled', 'Διεκπεραιώθηκε') : t('Reopen', 'Επαναφορά')}
                  </button>
                </td>
              </tr>

              {open === inq.id && (
                <tr>
                  <td colSpan={5} style={{ background: 'rgba(255,255,255,.02)' }}>
                    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 10 }}>
                      <a className="btn btn-ghost btn-sm" href={`mailto:${inq.email}`}>
                        <Mail size={13} aria-hidden />
                        {t('Reply', 'Απάντηση')}
                      </a>
                      {inq.phone && (
                        <a className="btn btn-ghost btn-sm" href={`tel:${inq.phone}`}>
                          <Phone size={13} aria-hidden />
                          {inq.phone}
                        </a>
                      )}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6 }}>
                      {inq.message}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  )
}

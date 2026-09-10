import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { useLang } from '../context/language'
import { useApplyTheme } from '../context/theme'
import {
  downloadOrderDocument,
  fetchMyDocuments,
  type MemberDocument,
  type OrderDocumentKind,
} from '../lib/api'
import { errorMessage } from '../lib/errors'
import { statusLabel } from '../lib/orderStatus'

const TABS: (OrderDocumentKind | 'all')[] = ['all', 'invoice', 'sow', 'quote']

/**
 * Every document issued against the member's orders, in one place.
 *
 * The dashboard's "Invoices" nav item pointed at nothing until order
 * documents existed; this is what it now opens.
 */
export default function Documents() {
  const { t, lang } = useLang()
  useApplyTheme()

  const [kind, setKind] = useState<OrderDocumentKind | 'all'>('all')
  const [documents, setDocuments] = useState<MemberDocument[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setDocuments(await fetchMyDocuments(kind === 'all' ? undefined : kind))
      setError(null)
    } catch (e) {
      setError(errorMessage(e, t('Could not load your documents.', 'Αδυναμία φόρτωσης εγγράφων.')))
    } finally {
      setLoading(false)
    }
  }, [kind, t])

  useEffect(() => {
    load()
  }, [load])

  const label = (k: OrderDocumentKind | 'all') =>
    ({
      all: t('All', 'Όλα'),
      invoice: t('Invoices', 'Τιμολόγια'),
      sow: t('Scope of Work', 'Scope of Work'),
      quote: t('Quotes', 'Προσφορές'),
      other: t('Other', 'Άλλα'),
    })[k]

  const size = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`

  const when = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  async function download(doc: MemberDocument) {
    setError(null)
    try {
      await downloadOrderDocument(doc.order.id, doc)
    } catch (e) {
      setError(errorMessage(e, t('Could not download that file.', 'Αδυναμία λήψης.')))
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">
            Home / {t('Dashboard', 'Πίνακας')} / {t('Documents', 'Έγγραφα')}
          </div>
          <div className="eyebrow">{t('Account', 'Λογαριασμός')}</div>
          <h1 className="h2 mt8">{t('Documents', 'Έγγραφα')}</h1>
          <p className="muted mt8">
            {t(
              'Scopes of Work, quotes and invoices issued against your orders.',
              'Scope of Work, προσφορές και τιμολόγια των παραγγελιών σας.',
            )}
          </p>
        </div>
      </div>

      <section className="section-sm">
        <div className="container">
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {TABS.map((k) => (
              <span
                key={k}
                className={`chip${kind === k ? ' on' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setKind(k)}
              >
                {label(k)}
              </span>
            ))}
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

          {!loading && documents.length === 0 ? (
            <div className="panel center" style={{ padding: 36 }}>
              <h3 style={{ fontSize: 17 }}>{t('Nothing here yet', 'Κανένα έγγραφο ακόμη')}</h3>
              <p className="muted mt8" style={{ fontSize: 14 }}>
                {t(
                  'Your Scope of Work and invoice appear here once our team issues them.',
                  'Το Scope of Work και τα τιμολόγια εμφανίζονται εδώ μόλις εκδοθούν.',
                )}
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="tbl">
                <tbody>
                  <tr>
                    <th>{t('Document', 'Έγγραφο')}</th>
                    <th>{t('Order', 'Παραγγελία')}</th>
                    <th>{t('Issued', 'Εκδόθηκε')}</th>
                    <th />
                  </tr>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td data-label={t('Document', 'Έγγραφο')}>
                        <FileText
                          size={14}
                          aria-hidden
                          style={{ color: 'var(--sky)', verticalAlign: '-2px', marginRight: 8 }}
                        />
                        {doc.name}
                        <div className="muted" style={{ fontSize: 12, marginLeft: 22 }}>
                          {label(doc.kind)} · {size(doc.size)}
                        </div>
                      </td>
                      <td data-label={t('Order', 'Παραγγελία')}>
                        <Link to={`/orders/${doc.order.id}`} style={{ color: 'var(--sky)' }}>
                          {doc.order.reference}
                        </Link>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {statusLabel(doc.order.status, t)}
                        </div>
                      </td>
                      <td data-label={t('Issued', 'Εκδόθηκε')}>{when(doc.created_at)}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => download(doc)}>
                          {t('Download', 'Λήψη')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Link className="btn btn-ghost btn-sm mt24" to="/dashboard">
            <ArrowLeft size={14} aria-hidden />
            {t('Back to dashboard', 'Πίσω στον πίνακα')}
          </Link>
        </div>
      </section>
    </>
  )
}

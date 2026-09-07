import { useRef, useState } from 'react'
import { Download, FileText, Trash2, Upload } from 'lucide-react'
import { useLang } from '../context/language'
import {
  deleteOrderDocument,
  downloadOrderDocument,
  uploadOrderDocument,
  type OrderDocument,
  type OrderDocumentKind,
} from '../lib/api'
import { errorMessage } from '../lib/errors'

const KINDS: OrderDocumentKind[] = ['sow', 'quote', 'invoice', 'other']

/**
 * The paperwork on an order. Admins attach; the customer whose order it is
 * can download. Both views share this component because they differ only in
 * whether the upload controls are shown.
 */
export default function OrderDocuments({
  orderId,
  documents,
  canManage,
  onChange,
}: {
  orderId: number
  documents: OrderDocument[]
  canManage: boolean
  onChange: () => void
}) {
  const { t, lang } = useLang()
  const fileRef = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<OrderDocumentKind>('sow')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const kindLabel = (k: OrderDocumentKind) =>
    ({
      sow: t('Scope of Work', 'Scope of Work'),
      quote: t('Quote', 'Προσφορά'),
      invoice: t('Invoice', 'Τιμολόγιο'),
      other: t('Other', 'Άλλο'),
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

  async function onPick(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await uploadOrderDocument(orderId, file, kind)
      onChange()
    } catch (e) {
      setError(errorMessage(e, t('Could not attach that file.', 'Αδυναμία επισύναψης.')))
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onDownload(doc: OrderDocument) {
    setError(null)
    try {
      await downloadOrderDocument(orderId, doc)
    } catch (e) {
      setError(errorMessage(e, t('Could not download that file.', 'Αδυναμία λήψης.')))
    }
  }

  async function onDelete(doc: OrderDocument) {
    if (!confirm(t(`Remove "${doc.name}"?`, `Αφαίρεση "${doc.name}";`))) return
    setError(null)
    try {
      await deleteOrderDocument(orderId, doc.id)
      onChange()
    } catch (e) {
      setError(errorMessage(e, t('Could not remove that file.', 'Αδυναμία αφαίρεσης.')))
    }
  }

  return (
    <div>
      <h4 className="head" style={{ fontSize: 12.5, letterSpacing: 1, color: 'var(--grey)', marginBottom: 10 }}>
        {t('DOCUMENTS', 'ΕΓΓΡΑΦΑ')}
      </h4>

      {documents.length === 0 && (
        <p className="muted" style={{ fontSize: 13 }}>
          {canManage
            ? t('Nothing attached yet.', 'Κανένα έγγραφο ακόμη.')
            : t(
                'Your Scope of Work and invoice will appear here once our team issues them.',
                'Το Scope of Work και το τιμολόγιο θα εμφανιστούν εδώ.',
              )}
        </p>
      )}

      {documents.map((doc) => (
        <div
          key={doc.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 0',
            borderBottom: '1px solid var(--line)',
            fontSize: 13,
          }}
        >
          <FileText size={15} aria-hidden style={{ color: 'var(--sky)', flex: 'none' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {doc.name}
            </div>
            <div className="muted" style={{ fontSize: 11.5 }}>
              {kindLabel(doc.kind)} · {size(doc.size)} · {when(doc.created_at)}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onDownload(doc)}
            title={t('Download', 'Λήψη')}
          >
            <Download size={13} aria-hidden />
          </button>
          {canManage && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onDelete(doc)}
              title={t('Remove', 'Αφαίρεση')}
            >
              <Trash2 size={13} aria-hidden />
            </button>
          )}
        </div>
      ))}

      {canManage && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as OrderDocumentKind)}
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              color: 'var(--text)',
              padding: '8px 10px',
              fontSize: 13,
            }}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {kindLabel(k)}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={13} aria-hidden />
            {busy ? t('Attaching…', 'Επισύναψη…') : t('Attach file', 'Επισύναψη')}
          </button>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <p className="muted" style={{ fontSize: 11.5, width: '100%', margin: 0 }}>
            {t('PDF, image, Word, Excel or CSV · up to 10 MB', 'PDF, εικόνα, Word, Excel ή CSV · έως 10 MB')}
          </p>
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 10 }}>{error}</p>
      )}
    </div>
  )
}

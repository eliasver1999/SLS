import { Fragment, useCallback, useEffect, useState } from 'react'
import { Bug, Globe, Server } from 'lucide-react'
import { useLang } from '../context/language'
import {
  fetchErrorEvents,
  resolveErrorEvent,
  type ErrorCounts,
  type ErrorReport,
} from '../lib/api'
import { errorMessage } from '../lib/errors'

/**
 * What has actually broken.
 *
 * Errors used to go to storage/logs on a disk that is wiped on restart, so
 * the first the team knew of a failed checkout was a customer's phone call.
 * Rows here are groups: the same crash arriving fifty times is one line
 * with a count, so a failure in a loop cannot bury everything else.
 */
export default function ErrorEvents({ onChange }: { onChange?: () => void }) {
  const { t, lang } = useLang()
  const [state, setState] = useState<'open' | 'resolved' | 'all'>('open')
  const [events, setEvents] = useState<ErrorReport[]>([])
  const [counts, setCounts] = useState<ErrorCounts>({ open: 0, resolved: 0 })
  const [open, setOpen] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetchErrorEvents(state)
      setEvents(res.data)
      setCounts(res.counts)
      setError(null)
    } catch (e) {
      setError(errorMessage(e, t('Could not load errors.', 'Αδυναμία φόρτωσης σφαλμάτων.')))
    }
  }, [state, t])

  useEffect(() => {
    load()
  }, [load])

  async function setResolved(event: ErrorReport, resolved: boolean) {
    try {
      await resolveErrorEvent(event.id, resolved)
      await load()
      onChange?.()
    } catch (e) {
      setError(errorMessage(e, t('Could not update that error.', 'Αδυναμία ενημέρωσης.')))
    }
  }

  const when = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString(lang === 'el' ? 'el-GR' : 'en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—'

  /**
   * "POST /api/orders" for a request, "/quote" for a page.
   *
   * API paths are stored without a leading slash and browser ones with it,
   * so the slash is normalised here rather than doubled.
   */
  const where = (event: ErrorReport) =>
    `${event.method ?? ''} /${(event.url ?? '').replace(/^\/+/, '')}`.trim()

  const tabs: { key: 'open' | 'resolved' | 'all'; label: string }[] = [
    { key: 'open', label: t('Open', 'Ανοιχτά') },
    { key: 'resolved', label: t('Resolved', 'Επιλυμένα') },
    { key: 'all', label: t('All', 'Όλα') },
  ]

  return (
    <>
      <h1 className="h2" style={{ fontSize: 26 }}>
        {t('Errors', 'Σφάλματα')}
      </h1>
      <p className="muted">
        {t(
          'Failures on the API and in visitors’ browsers, grouped by where they happen. Resolving one is not deleting it — if it happens again it reopens itself.',
          'Σφάλματα του API και των browsers, ομαδοποιημένα. Η επίλυση δεν είναι διαγραφή — αν συμβεί ξανά, ανοίγει μόνο του.',
        )}
      </p>

      <div className="kpis mt24">
        <div className="kpi">
          <div className="n" style={{ color: counts.open ? 'var(--danger)' : 'var(--ok)' }}>
            {counts.open}
          </div>
          <div className="l">{t('Open', 'Ανοιχτά')}</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ color: 'var(--ok)' }}>
            {counts.resolved}
          </div>
          <div className="l">{t('Resolved', 'Επιλυμένα')}</div>
        </div>
      </div>

      <div className="mt24" style={{ display: 'flex', gap: 8 }}>
        {tabs.map((tab) => (
          <span
            key={tab.key}
            className={`chip${state === tab.key ? ' on' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setState(tab.key)}
          >
            {tab.label}
          </span>
        ))}
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</p>}

      {events.length === 0 ? (
        <div className="panel center mt24" style={{ padding: 36 }}>
          <Bug size={22} aria-hidden style={{ color: 'var(--ok)' }} />
          <h3 className="mt8" style={{ fontSize: 17 }}>
            {state === 'open'
              ? t('Nothing is broken', 'Τίποτα χαλασμένο')
              : t('Nothing here', 'Κανένα')}
          </h3>
          <p className="muted mt8" style={{ fontSize: 14 }}>
            {t(
              'Server exceptions and browser crashes appear here as they happen.',
              'Σφάλματα διακομιστή και browser εμφανίζονται εδώ.',
            )}
          </p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="tbl mt16">
            <tbody>
              <tr>
                <th>{t('Error', 'Σφάλμα')}</th>
                <th>{t('Where', 'Πού')}</th>
                <th>{t('Count', 'Πλήθος')}</th>
                <th>{t('Last seen', 'Τελευταία')}</th>
                <th />
              </tr>

              {events.map((event) => (
                <Fragment key={event.id}>
                  <tr
                    style={{ cursor: 'pointer' }}
                    onClick={() => setOpen(open === event.id ? null : event.id)}
                  >
                    <td>
                      {event.source === 'client' ? (
                        <Globe
                          size={14}
                          aria-hidden
                          style={{ color: 'var(--warn)', verticalAlign: '-2px', marginRight: 8 }}
                        />
                      ) : (
                        <Server
                          size={14}
                          aria-hidden
                          style={{ color: 'var(--danger)', verticalAlign: '-2px', marginRight: 8 }}
                        />
                      )}
                      <b>{event.type}</b>
                      <div className="muted" style={{ fontSize: 12, marginLeft: 22 }}>
                        {event.message}
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      {event.url ? where(event) : '—'}
                      {event.file && (
                        <div className="muted" style={{ fontSize: 11.5 }}>
                          {event.file}
                          {event.line ? `:${event.line}` : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status ${event.occurrences > 5 ? 'rej' : 'wait'}`}>
                        {event.occurrences}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{when(event.last_seen_at)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setResolved(event, event.resolved_at === null)
                        }}
                      >
                        {event.resolved_at === null
                          ? t('Resolve', 'Επίλυση')
                          : t('Reopen', 'Επαναφορά')}
                      </button>
                    </td>
                  </tr>

                  {open === event.id && (
                    <tr>
                      <td colSpan={5} style={{ background: 'var(--surface-sunken)' }}>
                        <div style={{ fontSize: 12.5, lineHeight: 1.7 }}>
                          <div>
                            <b>{t('First seen', 'Πρώτη εμφάνιση')}:</b> {when(event.first_seen_at)}
                          </div>
                          {event.user && (
                            <div>
                              <b>{t('Signed in as', 'Συνδεδεμένος ως')}:</b> {event.user.name} (
                              {event.user.email})
                            </div>
                          )}
                          {event.context?.release ? (
                            <div>
                              <b>{t('Build', 'Build')}:</b> {String(event.context.release)}
                            </div>
                          ) : null}
                        </div>
                        {event.trace && (
                          <pre
                            style={{
                              marginTop: 12,
                              padding: 12,
                              overflowX: 'auto',
                              fontSize: 11.5,
                              lineHeight: 1.6,
                              background: 'var(--input-bg)',
                              borderRadius: 8,
                              // The trace is text, never markup — React escapes
                              // it, and it is rendered in a pre for that reason.
                              whiteSpace: 'pre',
                            }}
                          >
                            {event.trace}
                          </pre>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

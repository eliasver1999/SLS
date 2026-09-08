import { Fragment } from 'react'
import {
  Ban,
  Bell,
  ClipboardCheck,
  FileText,
  MessageSquare,
  ShoppingCart,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { useLang } from '../context/language'
import { formatCents } from '../lib/money'
import type { Activity, ActivityEvent, ActivityKind } from '../lib/api'

/**
 * What has happened since the team last looked.
 *
 * The notification emails still go out, but they are no longer the only
 * record: a filtered or overlooked email no longer means an overlooked
 * order. Events needing someone to pick them up are called out, because a
 * feed that only says "this happened" is a worse tool than one that says
 * "this is still waiting for you".
 */
export default function ActivityFeed({
  activity,
  error,
  onOpen,
}: {
  activity: Activity | null
  error: string | null
  onOpen: (section: ActivityEvent['section'], orderId?: number) => void
}) {
  const { t, lang } = useLang()
  const locale = lang === 'el' ? 'el-GR' : 'en-GB'

  const events = activity?.data ?? []
  const waiting = events.filter((e) => e.needs_action).length
  const unread = events.filter((e) => e.unread).length

  const KIND: Record<ActivityKind, { Icon: LucideIcon; colour: string; label: string }> = {
    'order.placed': {
      Icon: ShoppingCart,
      colour: 'var(--ok)',
      label: t('Order', 'Παραγγελία'),
    },
    'quote.requested': {
      Icon: FileText,
      colour: 'var(--sky)',
      label: t('Quote', 'Προσφορά'),
    },
    'order.cancelled': { Icon: Ban, colour: 'var(--danger)', label: t('Cancelled', 'Ακύρωση') },
    'inquiry.received': {
      Icon: MessageSquare,
      colour: 'var(--warn)',
      label: t('Enquiry', 'Αίτημα'),
    },
    'member.registered': {
      Icon: UserPlus,
      colour: 'var(--info)',
      label: t('Registration', 'Εγγραφή'),
    },
    'application.received': {
      Icon: ClipboardCheck,
      colour: 'var(--info)',
      label: t('Application', 'Αίτηση'),
    },
  }

  /** "4 hours ago" — a feed is read in terms of how long something has waited. */
  const ago = (iso: string) => {
    const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
    if (seconds < 60) return t('just now', 'μόλις τώρα')

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    const steps: [Intl.RelativeTimeFormatUnit, number][] = [
      ['minute', 60],
      ['hour', 3600],
      ['day', 86400],
      ['week', 604800],
      ['month', 2629800],
      ['year', 31557600],
    ]

    let [unit, size] = steps[0]
    for (const step of steps) {
      if (seconds >= step[1]) [unit, size] = step
    }

    return rtf.format(-Math.round(seconds / size), unit)
  }

  /** Day headings, so a long feed reads as a diary rather than a list. */
  const dayLabel = (iso: string) => {
    const day = new Date(iso)
    const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const days = Math.round((midnight(new Date()) - midnight(day)) / 86400000)

    if (days === 0) return t('Today', 'Σήμερα')
    if (days === 1) return t('Yesterday', 'Χθες')

    return day.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
  }

  return (
    <>
      <h1 className="h2" style={{ fontSize: 26 }}>
        {t('Activity', 'Δραστηριότητα')}
      </h1>
      <p className="muted">
        {/* Deliberately does not promise that the notification emails go out:
            whether they do is a deployment question, answered by the banner
            above rather than by this paragraph. */}
        {t(
          'Everything customers have done, newest first — so a missed email is never a missed order.',
          'Όλα όσα έκαναν οι πελάτες, με τα νεότερα πρώτα — ώστε ένα χαμένο email να μην είναι ποτέ χαμένη παραγγελία.',
        )}
      </p>

      <div className="kpis mt24">
        <div className="kpi">
          <div className="n" style={{ color: waiting ? 'var(--warn)' : 'var(--ok)' }}>
            {waiting}
          </div>
          <div className="l">{t('Waiting on us', 'Σε αναμονή μας')}</div>
        </div>
        <div className="kpi">
          <div className="n">{unread}</div>
          <div className="l">{t('New since last visit', 'Νέα από την τελευταία επίσκεψη')}</div>
        </div>
        <div className="kpi">
          <div className="n">{events.length}</div>
          <div className="l">{t('Recent events', 'Πρόσφατα συμβάντα')}</div>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 16 }}>{error}</p>}

      {activity && events.length === 0 && (
        <div className="panel center mt24" style={{ padding: 36 }}>
          <Bell size={22} aria-hidden style={{ color: 'var(--text-soft)' }} />
          <h3 className="mt8" style={{ fontSize: 17 }}>
            {t('Nothing has happened yet', 'Καμία δραστηριότητα ακόμη')}
          </h3>
          <p className="muted mt8" style={{ fontSize: 14 }}>
            {t(
              'Orders, quote requests, enquiries and registrations appear here as they arrive.',
              'Παραγγελίες, αιτήματα προσφοράς και εγγραφές θα εμφανίζονται εδώ.',
            )}
          </p>
        </div>
      )}

      <div className="feed mt24">
        {events.map((event, i) => {
          const kind = KIND[event.kind]
          const heading = dayLabel(event.at)
          const newDay = i === 0 || dayLabel(events[i - 1].at) !== heading

          return (
            <Fragment key={event.id}>
              {newDay && <div className="feed-day">{heading}</div>}

              <button
                className={`feed-row${event.unread ? ' unread' : ''}`}
                onClick={() => onOpen(event.section, event.order_id)}
              >
                <span className="feed-ic" style={{ color: kind.colour }}>
                  <kind.Icon size={16} aria-hidden />
                </span>

                <span className="feed-body">
                  <span className="feed-title">{event.title}</span>
                  <span className="feed-meta">
                    {kind.label}
                    {event.detail && ` · ${event.detail}`}
                    {event.amount_cents != null &&
                      ` · ${formatCents(event.amount_cents, lang, event.currency ?? undefined)}`}
                  </span>
                </span>

                <span className="feed-side">
                  {event.needs_action && (
                    <span className="status wait">{t('Needs action', 'Χρειάζεται ενέργεια')}</span>
                  )}
                  <span className="feed-when">{ago(event.at)}</span>
                </span>
              </button>
            </Fragment>
          )
        })}
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import { CircleAlert, TriangleAlert } from 'lucide-react'
import { useLang } from '../context/language'
import { fetchSystemChecks, type SystemCheck } from '../lib/api'

/**
 * Deployment problems, shown to the admin on every screen.
 *
 * This exists because the transactional email system was finished, tested
 * and delivering nothing for weeks — MAIL_MAILER was still 'log' — and no
 * screen in the application said so. A configuration mistake that swallows
 * customer email should not be quieter than a validation error.
 *
 * It sits above every section rather than on a settings page: the whole
 * failure mode was that nobody went looking.
 */
export default function SystemAlerts() {
  const { t } = useLang()
  const [problems, setProblems] = useState<SystemCheck[]>([])

  useEffect(() => {
    // A failure to fetch is deliberately silent: this is a diagnostic, and
    // it must never be the reason the admin cannot work.
    fetchSystemChecks()
      .then(({ problems }) => setProblems(problems))
      .catch(() => {})
  }, [])

  if (problems.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
      {problems.map((problem) => {
        const fatal = problem.status === 'fail'
        const colour = fatal ? 'var(--danger)' : 'var(--warn)'

        return (
          <div
            key={problem.key}
            className="notice"
            style={{
              borderColor: colour,
              background: fatal ? 'var(--danger-bg)' : 'var(--warn-bg)',
              alignItems: 'flex-start',
            }}
          >
            <div className="ic" style={{ color: colour }}>
              {fatal ? <CircleAlert size={18} aria-hidden /> : <TriangleAlert size={18} aria-hidden />}
            </div>
            <div>
              <b style={{ fontSize: 14 }}>
                {fatal ? t('Not working', 'Δεν λειτουργεί') : t('Needs attention', 'Χρειάζεται προσοχή')}
                {' — '}
                {problem.label}
              </b>
              <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.55 }}>{problem.detail}</div>
              {problem.fix && (
                <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                  {problem.fix}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { useLang } from '../context/language'
import { fetchOrderReport, type OrderReport } from '../lib/api'
import { errorMessage } from '../lib/errors'
import { statusLabel } from '../lib/orderStatus'

/**
 * Order reporting. Every figure is ex VAT — the tax is collected for the
 * state and is not revenue, so including it would overstate the business by
 * whatever the rate happens to be.
 */
export default function Reports() {
  const { t } = useLang()
  const [report, setReport] = useState<OrderReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrderReport()
      .then(setReport)
      .catch((e) =>
        setError(errorMessage(e, t('Could not load the report.', 'Αδυναμία φόρτωσης αναφοράς.'))),
      )
  }, [t])

  const peak = report ? Math.max(1, ...report.by_month.map((m) => m.cents)) : 1

  return (
    <>
      <h1 className="h2" style={{ fontSize: 26 }}>
        {t('Reports', 'Αναφορές')}
      </h1>
      <p className="muted">
        {t(
          'Order values, ex VAT. VAT is collected on the state’s behalf, so it is not counted as revenue.',
          'Αξίες παραγγελιών, χωρίς ΦΠΑ. Ο ΦΠΑ δεν προσμετρείται ως έσοδο.',
        )}
      </p>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</p>
      )}

      {report && (
        <>
          <div className="kpis mt24">
            <div className="kpi">
              <div className="n blue" style={{ fontSize: 26 }}>
                {report.headline.pipeline}
              </div>
              <div className="l">{t('Open order value', 'Αξία ανοιχτών')}</div>
            </div>
            <div className="kpi">
              <div className="n" style={{ fontSize: 26, color: 'var(--ok)' }}>
                {report.headline.won}
              </div>
              <div className="l">{t('Completed', 'Ολοκληρωμένα')}</div>
            </div>
            <div className="kpi">
              <div className="n" style={{ fontSize: 26 }}>
                {report.headline.open_count}
              </div>
              <div className="l">{t('Open requests', 'Ανοιχτά αιτήματα')}</div>
            </div>
            <div className="kpi">
              <div className="n" style={{ fontSize: 26 }}>
                {report.headline.average_order}
              </div>
              <div className="l">{t('Avg. completed order', 'Μ.Ο. ολοκληρωμένης')}</div>
            </div>
          </div>

          <h3 className="head mt40" style={{ fontSize: 15, letterSpacing: 1, color: 'var(--grey)' }}>
            {t('LAST 6 MONTHS', 'ΤΕΛΕΥΤΑΙΟΙ 6 ΜΗΝΕΣ')}
          </h3>
          <div className="panel mt16">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 160 }}>
              {report.by_month.map((m) => (
                <div key={m.month} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    title={`${m.count} × ${m.value}`}
                    style={{
                      height: `${Math.round((m.cents / peak) * 120)}px`,
                      minHeight: m.cents > 0 ? 4 : 2,
                      background:
                        m.cents > 0
                          ? 'linear-gradient(180deg, var(--sky), var(--electric))'
                          : 'var(--line)',
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{m.label}</div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {m.count > 0 ? m.value : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h3 className="head mt40" style={{ fontSize: 15, letterSpacing: 1, color: 'var(--grey)' }}>
            {t('BY STATUS', 'ΑΝΑ ΚΑΤΑΣΤΑΣΗ')}
          </h3>
          <div className="table-scroll mt16">
            <table className="tbl">
              <tbody>
                <tr>
                  <th>{t('Status', 'Κατάσταση')}</th>
                  <th>{t('Requests', 'Αιτήματα')}</th>
                  <th style={{ textAlign: 'right' }}>{t('Value (ex VAT)', 'Αξία (χ/ΦΠΑ)')}</th>
                </tr>
                {report.by_status.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">
                      {t('No orders yet.', 'Καμία παραγγελία ακόμη.')}
                    </td>
                  </tr>
                )}
                {report.by_status.map((row) => (
                  <tr key={row.status}>
                    <td data-label={t('Status', 'Κατάσταση')}>{statusLabel(row.status, t)}</td>
                    <td data-label={t('Requests', 'Αιτήματα')}>{row.count}</td>
                    <td data-label={t('Value (ex VAT)', 'Αξία (χ/ΦΠΑ)')} style={{ textAlign: 'right' }}>{row.value}</td>
                  </tr>
                ))}
                {report.by_type.map((row) => (
                  <tr key={row.type}>
                    <td data-label={t('Status', 'Κατάσταση')} className="muted">
                      <TrendingUp size={13} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
                      {row.type === 'quote' ? t('All quotes', 'Όλες οι προσφορές') : t('All orders', 'Όλες οι παραγγελίες')}
                    </td>
                    <td data-label={t('Requests', 'Αιτήματα')} className="muted">{row.count}</td>
                    <td data-label={t('Value (ex VAT)', 'Αξία (χ/ΦΠΑ)')} className="muted" style={{ textAlign: 'right' }}>
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}

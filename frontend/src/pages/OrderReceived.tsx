import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../context/language'

/**
 * After an order is placed.
 *
 * This page used to promise a "Scope of Work (SOW) to sign" and an emailed
 * invoice — neither of which the order flow does any more — and, opened
 * without an order behind it, it showed a made-up reference, SLS-ORD-50231.
 * It now says what actually happens next, and shows a reference only when
 * there is one.
 */
export default function OrderReceived() {
  const { t } = useLang()
  const { state } = useLocation()
  const { reference, id } = (state ?? {}) as { reference?: string; id?: number }

  return (
    <section className="section" data-enter aria-labelledby="rec-h">
      <div className="wrap grid">
        <div className="span-5 stack-5">
          <div className="section-head">
            <h1 id="rec-h">{t('Order sent', 'Η παραγγελία στάλθηκε')}</h1>
            <p>
              {t(
                'SLS reads it within one business day and either accepts it at the price you saw or sends it back repriced for you to accept. Nothing has been charged.',
                'Η SLS τη διαβάζει εντός μίας εργάσιμης και είτε την αποδέχεται στην τιμή που είδατε είτε την επιστρέφει επανατιμολογημένη για αποδοχή. Δεν έχει χρεωθεί τίποτα.',
              )}
            </p>
          </div>
          <div className="btn-row">
            <Link className="btn btn--primary" to={id ? `/orders/${id}` : '/dashboard'}>
              {id ? t('Open the order', 'Άνοιγμα παραγγελίας') : t('Your orders', 'Οι παραγγελίες σας')}
            </Link>
            <Link className="link" to="/catalogue">
              {t('Back to the catalogue', 'Πίσω στον κατάλογο')}
            </Link>
          </div>
        </div>

        <div className="span-6 start-7 auth__panel">
          <p className="t-label muted">{t('What happens next', 'Τι ακολουθεί')}</p>
          <ul className="rows rows--spec">
            {reference && (
              <li>
                <span className="rows__name">{t('Reference', 'Αριθμός')}</span>
                <span className="rows__value mono">{reference}</span>
              </li>
            )}
            <li>
              <span className="rows__name">{t('SLS accepts or reprices it', 'Η SLS την αποδέχεται ή την επανατιμολογεί')}</span>
              <span className="rows__value">{t('Within a day', 'Εντός ημέρας')}</span>
            </li>
            <li>
              <span className="rows__name">{t('Deposit invoice, half the total', 'Τιμολόγιο προκαταβολής, το μισό')}</span>
              <span className="rows__value">{t('On acceptance', 'Με την αποδοχή')}</span>
            </li>
            <li>
              <span className="rows__name">{t('Built to order', 'Κατασκευή κατά παραγγελία')}</span>
              <span className="rows__value">{t('2 to 5 weeks', '2 έως 5 εβδομάδες')}</span>
            </li>
            <li>
              <span className="rows__name">{t('Balance invoice', 'Τιμολόγιο υπολοίπου')}</span>
              <span className="rows__value">{t('When it is done', 'Με την ολοκλήρωση')}</span>
            </li>
          </ul>
          <p className="t-small muted">
            {t(
              'Every step, and every invoice, appears on the order page as it happens. Questions go to sales@sls.gr.',
              'Κάθε βήμα και κάθε τιμολόγιο εμφανίζεται στη σελίδα της παραγγελίας. Ερωτήσεις στο sales@sls.gr.',
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

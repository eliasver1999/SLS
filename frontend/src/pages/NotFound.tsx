import { Link } from 'react-router-dom'
import { useLang } from '../context/language'

/**
 * Not found. The address that failed is shown back, so a mistyped link is
 * recognisable, and the ways on are the ones a visitor here most likely
 * wanted: the catalogue, the order flow, a person.
 */
export default function NotFound() {
  const { t } = useLang()

  return (
    <section className="section" data-enter aria-labelledby="nf-h">
      <div className="wrap grid">
        <div className="span-6 stack-5">
          <div className="section-head">
            <p className="t-label muted mono">404 · {window.location.pathname}</p>
            <h1 id="nf-h">{t('No page at this address', 'Δεν υπάρχει σελίδα σε αυτή τη διεύθυνση')}</h1>
            <p>
              {t(
                'The link is out of date or was mistyped. The catalogue, the ranges and the order pages are where they always were.',
                'Ο σύνδεσμος είναι παλιός ή γράφτηκε λάθος. Ο κατάλογος, οι σειρές και οι παραγγελίες είναι εκεί που ήταν πάντα.',
              )}
            </p>
          </div>
          <div className="btn-row">
            <Link className="btn btn--primary" to="/catalogue">
              {t('See the catalogue', 'Δείτε τον κατάλογο')}
            </Link>
            <Link className="link" to="/contact">
              {t('Ask SLS', 'Ρωτήστε τη SLS')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

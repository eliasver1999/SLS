import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { useMainAction } from '../lib/mainAction'

/**
 * How an order runs — the page that /projects used to be.
 *
 * /projects held six case studies with client types, square metres and
 * audience sizes that exist nowhere in this repository. They were written to
 * look specific. Real ones need the client's own photographs, the client's
 * permission and the real figures; until those exist, the honest page in
 * that slot is this one, which describes a mechanism the code actually
 * implements (OrderController, InvoiceIssuer, config/sls.php).
 */
export default function Ordering() {
  const { t } = useLang()
  const action = useMainAction()

  return (
    <>
      <section className="hero hero--product" data-enter aria-labelledby="ord-h">
        <div className="wrap">
          <div className="hero-text hero__in">
            <div className="hero__head">
              <div>
                <h1 id="ord-h">{t('How an order runs', 'Πώς γίνεται μια παραγγελία')}</h1>
                <p className="hero__lead">
                  {t(
                    'From the application to the second invoice. Half the total is paid when SLS accepts the order; the balance when the job is finished.',
                    'Από την αίτηση μέχρι το δεύτερο τιμολόγιο. Το μισό του συνόλου πληρώνεται όταν η SLS αποδεχθεί την παραγγελία· το υπόλοιπο όταν ολοκληρωθεί η δουλειά.',
                  )}
                </p>
              </div>
              <div className="btn-row">
                <Link className="btn btn--primary" to={action.to}>
                  {action.label}
                </Link>
              </div>
            </div>
            <div className="hero__stage">
              <img
                src="/assets/shots/photo-f181466405-960.jpg"
                srcSet="/assets/shots/photo-f181466405-500.jpg 500w, /assets/shots/photo-f181466405-960.jpg 960w"
                sizes="100vw"
                width={960}
                height={720}
                alt={t(
                  'Two foam-lined flight cases open on a yard, the way fixtures travel',
                  'Δύο flight cases με αφρολέξ ανοιχτά σε μια αυλή, έτσι ταξιδεύουν τα φωτιστικά',
                )}
                style={{ '--ly-pos': '50% 50%' } as React.CSSProperties}
                fetchPriority="high"
                data-source="stand-in"
                data-subject="flight cases"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="steps" aria-labelledby="steps-h">
        <div className="wrap">
          <div className="section-head">
            <h2 id="steps-h">{t('An order in three stages', 'Μια παραγγελία σε τρία στάδια')}</h2>
          </div>
          <div className="grid">
            <article className="card card--open card--row span-4">
              <span className="step-num">1</span>
              <h3 className="t-card">{t('Open a trade account', 'Ανοίξτε λογαριασμό χονδρικής')}</h3>
              <p>
                {t(
                  'Apply with your company name and VAT number. Once SLS approves it, every price in the catalogue is visible and you can order.',
                  'Κάντε αίτηση με την επωνυμία και το ΑΦΜ της εταιρείας σας. Μόλις η SLS την εγκρίνει, κάθε τιμή του καταλόγου είναι ορατή και μπορείτε να παραγγείλετε.',
                )}
              </p>
            </article>
            <article className="card card--open card--row span-4">
              <span className="step-num">2</span>
              <h3 className="t-card">{t('Place the order', 'Κάντε την παραγγελία')}</h3>
              <p>
                {t(
                  'Choose the models and the quantities, add the date and the venue, and send it. SLS either accepts it at the price you saw, or sends it back repriced for you to accept.',
                  'Επιλέξτε μοντέλα και ποσότητες, προσθέστε ημερομηνία και χώρο και στείλτε την. Η SLS είτε την αποδέχεται στην τιμή που είδατε, είτε την επιστρέφει επανατιμολογημένη για να την αποδεχθείτε.',
                )}
              </p>
            </article>
            <article className="card card--open card--row span-4">
              <span className="step-num">3</span>
              <h3 className="t-card">{t('Pay, then take delivery', 'Πληρώστε και παραλάβετε')}</h3>
              <p>
                {t(
                  'The deposit invoice appears on your order page when SLS accepts. The build takes two to five weeks; the balance is invoiced when the job is finished.',
                  'Το τιμολόγιο προκαταβολής εμφανίζεται στη σελίδα της παραγγελίας σας μόλις η SLS την αποδεχθεί. Η κατασκευή παίρνει δύο έως πέντε εβδομάδες· το υπόλοιπο τιμολογείται όταν ολοκληρωθεί η δουλειά.',
                )}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="terms" aria-labelledby="terms-h">
        <div className="wrap grid">
          <div className="span-5">
            <div className="section-head">
              <h2 id="terms-h">{t('What you pay, and when', 'Τι πληρώνετε και πότε')}</h2>
            </div>
            <ul className="rows rows--spec">
              <li>
                <span className="rows__name">{t('Deposit', 'Προκαταβολή')}</span>
                <span className="rows__value">50%</span>
              </li>
              <li>
                <span className="rows__name">{t('Balance', 'Υπόλοιπο')}</span>
                <span className="rows__value">{t('On completion', 'Με την ολοκλήρωση')}</span>
              </li>
              <li>
                <span className="rows__name">{t('VAT', 'ΦΠΑ')}</span>
                <span className="rows__value">24%</span>
              </li>
              <li>
                <span className="rows__name">{t('Catalogue prices', 'Τιμές καταλόγου')}</span>
                <span className="rows__value">{t('Ex VAT, in euro', 'Χωρίς ΦΠΑ, σε ευρώ')}</span>
              </li>
              <li>
                <span className="rows__name">{t('Payment', 'Πληρωμή')}</span>
                <span className="rows__value">{t('Bank transfer', 'Τραπεζικό έμβασμα')}</span>
              </li>
            </ul>
            <p className="t-small muted">
              {t(
                'The bank details are on the invoice, and every invoice stays on the order page.',
                'Τα τραπεζικά στοιχεία είναι στο τιμολόγιο και κάθε τιμολόγιο μένει στη σελίδα της παραγγελίας.',
              )}
            </p>
          </div>
          <figure
            className="frame frame--photo span-6 start-7"
            style={{ '--ratio': '125%' } as React.CSSProperties}
          >
            <img
              className="frame__img"
              src="/assets/shots/photo-f181466410-500.jpg"
              sizes="(max-width: 1023px) 100vw, 50vw"
              width={500}
              height={667}
              alt={t(
                'A shelved flight case with foam dividers, open against a wall',
                'Flight case με ράφια και διαχωριστικά αφρολέξ, ανοιχτό μπροστά σε τοίχο',
              )}
              loading="lazy"
              data-source="stand-in"
              data-subject="case interior"
            />
          </figure>
        </div>
      </section>
    </>
  )
}

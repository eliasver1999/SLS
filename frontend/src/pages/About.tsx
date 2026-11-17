import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { useMainAction } from '../lib/mainAction'

/**
 * About SLS.
 *
 * This page used to be the brand deck: four personality words (Premium,
 * Precise, Energetic, Welcoming), a mission sentence, a positioning
 * statement and a table headed "Who we sell to" with the customers sorted
 * into Primary and Secondary tiers. That is an internal document; a
 * customer reading it learns which tier they are in.
 *
 * What is left is what a buyer actually wants from an About page: what the
 * company sells, who it sells to, and what it will not do.
 */
export default function About() {
  const { t } = useLang()
  const action = useMainAction()

  return (
    <>
      {/* The opening was a full screen of two paragraphs; it is the dealt
          product hero now, the kit lit, with the same two facts. */}
      <section className="hero hero--product" data-enter aria-labelledby="about-h">
        <div className="wrap">
          <div className="hero-text hero__in">
            <div className="hero__head">
              <div>
                <h1 id="about-h">{t('About SLS', 'Σχετικά με τη SLS')}</h1>
                <p className="hero__lead">
                  {t(
                    'SLS supplies LED walls, stage lighting and sound systems to the companies that build events in Greece. Six models, almost all made to order, sold from Athens to businesses with a VAT number.',
                    'Η SLS προμηθεύει LED τοίχους, φωτισμό σκηνής και ηχητικά συστήματα στις εταιρείες που στήνουν εκδηλώσεις στην Ελλάδα. Έξι μοντέλα, σχεδόν όλα κατά παραγγελία, από την Αθήνα σε επιχειρήσεις με ΑΦΜ.',
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
                src="/assets/shots/photo-f2162506-960.jpg"
                srcSet="/assets/shots/photo-f2162506-500.jpg 500w, /assets/shots/photo-f2162506-960.jpg 960w"
                sizes="(max-width: 639px) 166vw, 100vw"
                width={960}
                height={722}
                alt={t(
                  'Moving heads on stands throwing beams across a covered stage',
                  'Moving heads σε βάσεις ρίχνουν δέσμες φωτός σε μια στεγασμένη σκηνή',
                )}
                style={{ '--ly-pos': '50% 40%' } as React.CSSProperties}
                fetchPriority="high"
                data-source="stand-in"
                data-subject="fixtures lit"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="buyers" aria-labelledby="buy-h">
        <div className="wrap grid">
          <div className="span-5">
            <div className="section-head">
              <h2 id="buy-h">{t('Who buys from SLS', 'Ποιοι αγοράζουν από τη SLS')}</h2>
            </div>
            <ul className="rows rows--spec">
              <li>
                <span className="rows__name">
                  {t('Event production companies', 'Εταιρείες παραγωγής εκδηλώσεων')}
                </span>
                <p>
                  {t(
                    'Concerts, festivals, tours and brand activations: the companies that carry the kit in and out again.',
                    'Συναυλίες, φεστιβάλ, περιοδείες και brand activations: οι εταιρείες που κουβαλούν τον εξοπλισμό μέσα κι έξω.',
                  )}
                </p>
              </li>
              <li>
                <span className="rows__name">{t('Venues', 'Χώροι')}</span>
                <p>
                  {t(
                    'Halls, clubs and conference rooms fitting a screen or a PA permanently, or offering one as part of the hire.',
                    'Αίθουσες, κλαμπ και συνεδριακοί χώροι που τοποθετούν μόνιμα οθόνη ή PA, ή τα προσφέρουν μαζί με την ενοικίαση.',
                  )}
                </p>
              </li>
              <li>
                <span className="rows__name">{t('Shops and showrooms', 'Καταστήματα και εκθέσεις')}</span>
                <p>
                  {t(
                    'A single indoor wall in a window or behind a counter, usually the Aurora P2.6 at its finest pitch.',
                    'Ένας μόνο εσωτερικός τοίχος σε βιτρίνα ή πίσω από έναν πάγκο, συνήθως το Aurora P2.6 στο λεπτότερο pitch του.',
                  )}
                </p>
              </li>
            </ul>
          </div>
          <figure
            className="frame frame--photo span-6 start-7"
            style={{ '--ratio': '75%' } as React.CSSProperties}
          >
            <img
              className="frame__img"
              src="/assets/shots/photo-f39317346-960.jpg"
              srcSet="/assets/shots/photo-f39317346-500.jpg 500w, /assets/shots/photo-f39317346-960.jpg 960w"
              sizes="(max-width: 1023px) 100vw, 50vw"
              width={960}
              height={722}
              alt={t(
                'Moving-head fixtures clamped to truss in a warehouse, rigged and ready to go out',
                'Moving head στερεωμένα σε truss σε αποθήκη, έτοιμα για αποστολή',
              )}
              loading="lazy"
              data-source="stand-in"
              data-subject="fixtures on truss"
            />
          </figure>
        </div>
      </section>

      <section className="section" id="limits" aria-labelledby="lim-h">
        <div className="wrap grid">
          <div className="span-7">
            <div className="section-head">
              <h2 id="lim-h">{t('What SLS does not do', 'Τι δεν κάνει η SLS')}</h2>
            </div>
            <ul className="rows">
              <li>
                <span className="rows__name">{t('Publish prices', 'Δημοσιεύει τιμές')}</span>
                <p>
                  {t(
                    'Prices are for approved trade accounts. There is no public price list and no price on request for the catalogue: apply, and the whole range opens at once.',
                    'Οι τιμές είναι για εγκεκριμένους λογαριασμούς χονδρικής. Δεν υπάρχει δημόσιος τιμοκατάλογος ούτε τιμή κατόπιν αιτήματος για τον κατάλογο: κάντε αίτηση και ανοίγει όλη η σειρά μαζί.',
                  )}
                </p>
              </li>
              <li>
                <span className="rows__name">{t('Sell to the public', 'Πουλάει σε ιδιώτες')}</span>
                <p>
                  {t(
                    'An account needs a company name and a VAT number. One panel for a living room is not an order SLS can take.',
                    'Ο λογαριασμός χρειάζεται επωνυμία εταιρείας και ΑΦΜ. Ένα panel για ένα σαλόνι δεν είναι παραγγελία που μπορεί να δεχθεί η SLS.',
                  )}
                </p>
              </li>
              <li>
                <span className="rows__name">{t('Ship from a shelf', 'Στέλνει από το ράφι')}</span>
                <p>
                  {t(
                    'Only the Flex P2.9 is held in stock. Everything else is built after the order is accepted, which is where the two to five weeks go.',
                    'Μόνο το Flex P2.9 κρατείται σε στοκ. Όλα τα υπόλοιπα κατασκευάζονται αφού γίνει δεκτή η παραγγελία — εκεί πάνε οι δύο έως πέντε εβδομάδες.',
                  )}
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}

import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { useMainAction } from '../lib/mainAction'
import CatalogueRows from '../components/CatalogueRows'

/**
 * The home page, built to the plan in PLAN-taste.md: the `product` hero, then
 * one idea a screen — the screens, the catalogue, lighting and sound, the one
 * admission on the dark band, the stage package, the questions.
 *
 * Every figure on this page comes from src/data/products.ts or
 * backend/config/sls.php. Nothing here is a claim the catalogue cannot back.
 *
 * The photographs are stand-ins from Wikimedia Commons, credited in the
 * footer and listed in REPORT-taste.md with the shot SLS has to take in each
 * one's place.
 */
export default function Home() {
  const { t } = useLang()
  const action = useMainAction()

  return (
    <>
      <section className="hero hero--product" data-enter aria-labelledby="hero-h">
        <div className="wrap">
          <div className="hero-text hero__in">
            <div className="hero__head">
              <div>
                <h1 id="hero-h">
                  {t('Screens, lights and sound, to order', 'Οθόνες, φώτα και ήχος, κατά παραγγελία')}
                </h1>
                <p className="hero__lead">
                  {t(
                    'LED walls, lighting rigs and PA systems for event companies and venues in Greece, made to order in two to five weeks.',
                    'LED τοίχοι, rig φωτισμού και συστήματα PA για εταιρείες εκδηλώσεων και χώρους στην Ελλάδα, κατά παραγγελία σε δύο έως πέντε εβδομάδες.',
                  )}
                </p>
              </div>
              <div className="btn-row">
                <Link className="btn btn--primary" to={action.to}>
                  {action.label}
                </Link>
                <Link className="btn btn--secondary" to="/catalogue">
                  {t('See the catalogue', 'Δείτε τον κατάλογο')}
                </Link>
              </div>
            </div>
            <div className="hero__stage">
              <img
                src="/assets/shots/photo-f39317346-960.jpg"
                srcSet="/assets/shots/photo-f39317346-500.jpg 500w, /assets/shots/photo-f39317346-960.jpg 960w"
                sizes="(max-width: 639px) 166vw, 100vw"
                width={960}
                height={722}
                alt={t(
                  'Rows of moving-head fixtures clamped to aluminium truss in a warehouse, ready to go out',
                  'Σειρές από moving head στερεωμένα σε αλουμινένιο truss σε αποθήκη, έτοιμα για αποστολή',
                )}
                style={{ '--ly-pos': '50% 46%' } as React.CSSProperties}
                fetchPriority="high"
                data-source="stand-in"
                data-subject="the kit on truss"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The screens range: what a wall is made of, and what the pitch buys. */}
      <section className="section" id="screens" style={{ '--h': 1 } as React.CSSProperties} aria-labelledby="screens-h">
        <div className="wrap">
          <div className="section-head">
            <h2 id="screens-h">
              {t('A wall is as many panels as your opening takes.', 'Ένας τοίχος είναι τόσα panels όσα χωράει το άνοιγμά σας.')}{' '}
              <span className="muted">
                {t(
                  'What changes between the models is the pitch between the lamps: 2.6 mm indoors, 3.9 mm outside in daylight.',
                  'Αυτό που αλλάζει ανάμεσα στα μοντέλα είναι το pitch ανάμεσα στις λυχνίες: 2.6 mm σε εσωτερικό χώρο, 3.9 mm έξω στο φως της ημέρας.',
                )}
              </span>
            </h2>
          </div>

          <figure
            className="frame frame--photo"
            data-moment="liquid-hover"
            data-moment-opts='{"strength": 0.55}'
          >
            <img
              className="frame__img"
              src="/assets/shots/photo-f167000710-960.jpg"
              srcSet="/assets/shots/photo-f167000710-500.jpg 500w, /assets/shots/photo-f167000710-960.jpg 960w"
              sizes="100vw"
              width={960}
              height={640}
              alt={t(
                'The lamps of an LED panel at close range, a grid of red, green and blue dots',
                'Οι λυχνίες ενός LED panel από κοντά, ένα πλέγμα από κόκκινες, πράσινες και μπλε κουκκίδες',
              )}
              loading="lazy"
              data-source="stand-in"
              data-subject="LED pixels"
            />
          </figure>

          <div className="grid facts">
            <div className="span-4">
              <p className="t-stat">2.6 – 3.9 mm</p>
              <p className="t-small muted">{t('Pixel pitch', 'Pixel pitch')}</p>
            </div>
            <div className="span-4">
              <p className="t-stat">3840 Hz</p>
              <p className="t-small muted">{t('Refresh rate', 'Ρυθμός ανανέωσης')}</p>
            </div>
            <div className="span-4">
              <p className="t-stat">{t('2 years', '2 χρόνια')}</p>
              <p className="t-small muted">{t('Warranty', 'Εγγύηση')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* The range, as a read-across list rather than six cards: every model
          is a line of figures, and a figure beside its name is easier to
          compare than a figure inside a card. */}
      <section className="section" id="catalogue" style={{ '--h': 1 } as React.CSSProperties} aria-labelledby="cat-h">
        <div className="wrap">
          <div className="section-head section-head--row">
            <div>
              <h2 id="cat-h">{t('Panels, fixtures and arrays', 'Panels, φωτιστικά και arrays')}</h2>
            </div>
            <Link className="link" to="/catalogue">
              {t('Open the catalogue', 'Ανοίξτε τον κατάλογο')}
            </Link>
          </div>
          <CatalogueRows />
        </div>
      </section>

      {/* Lighting and sound, beside the line array. */}
      <section className="section" id="rig" style={{ '--h': 1 } as React.CSSProperties} aria-labelledby="rig-h">
        <div className="wrap grid">
          <div className="span-5">
            <div className="section-head">
              <h2 id="rig-h">
                {t(
                  'Lighting and sound go on the same order',
                  'Φωτισμός και ήχος μπαίνουν στην ίδια παραγγελία',
                )}
              </h2>
              <p>
                {t(
                  'The Beam 380 is a 380 W moving head on DMX-512, 19 kg in the clamp. The LA-12 is a bi-amped line array, two 12-inch drivers to a box, 140 dB at full output.',
                  'Το Beam 380 είναι ένα moving head 380 W σε DMX-512, 19 kg στο clamp. Το LA-12 είναι ένα bi-amped line array, δύο δώδεκα ιντσών σε κάθε κιβώτιο, 140 dB στη μέγιστη ισχύ.',
                )}
              </p>
            </div>
            <p className="t-body">
              {t(
                'Both are made to order in two to three weeks, and both go out on the same order and the same invoice as a screen.',
                'Και τα δύο κατασκευάζονται σε δύο έως τρεις εβδομάδες και φεύγουν με την ίδια παραγγελία και το ίδιο τιμολόγιο με μια οθόνη.',
              )}
            </p>
            <p>
              <Link className="link" to="/solutions">
                {t('See the three ranges', 'Δείτε τις τρεις σειρές')}
              </Link>
            </p>
          </div>
          <figure className="frame frame--photo span-6 start-7">
            <img
              className="frame__img"
              src="/assets/shots/photo-f7751364-960.jpg"
              srcSet="/assets/shots/photo-f7751364-500.jpg 500w, /assets/shots/photo-f7751364-960.jpg 960w"
              sizes="(max-width: 1023px) 100vw, 50vw"
              width={960}
              height={1433}
              alt={t(
                'A line array of loudspeakers flown from truss above a hall',
                'Ένα line array ηχείων αναρτημένο από truss πάνω από μια αίθουσα',
              )}
              loading="lazy"
              data-source="stand-in"
              data-subject="line array flown"
            />
          </figure>
        </div>
      </section>

      {/* The dealt dark band, and the page's one admission. The statement is
          the word-highlight moment's own section. */}
      <section
        className="section ground-inverse"
        id="prices"
        style={{ '--h': 1 } as React.CSSProperties}
        data-moment="word-highlight"
        aria-labelledby="prices-h"
      >
        <div className="wrap">
          <h2 id="prices-h" className="sr-only">
            {t('Prices', 'Τιμές')}
          </h2>
          <p className="mo-wh__text statement">
            {t('SLS does not publish prices. Apply for a trade account, and once it is ', 'Η SLS δεν δημοσιεύει τιμές. Κάντε αίτηση για λογαριασμό χονδρικής και μόλις ')}
            <strong>{t('approved', 'εγκριθεί')}</strong>
            {t(
              ' every price in the catalogue is visible: the whole range, not a quote for one job.',
              ' κάθε τιμή του καταλόγου είναι ορατή: όλη η σειρά, όχι μια προσφορά για μία δουλειά.',
            )}
          </p>
        </div>
      </section>

      {/* The stage package: the one thing SLS delivers, rigs and operates. */}
      <section className="section" id="package" style={{ '--h': 1 } as React.CSSProperties} aria-labelledby="pack-h">
        <div className="wrap">
          <div className="section-head">
            <h2 id="pack-h">{t('The stage package arrives as one job', 'Το πακέτο σκηνής έρχεται ως μία δουλειά')}</h2>
            <p>
              {t(
                'Twelve square metres of wall, eight moving heads and a 2 kW PA, delivered and set up together, with an operator at the desk. One order, one delivery, one invoice.',
                'Δώδεκα τετραγωνικά μέτρα οθόνης, οκτώ moving heads και PA 2 kW, με παράδοση και εγκατάσταση μαζί και χειριστή στην κονσόλα. Μία παραγγελία, μία παράδοση, ένα τιμολόγιο.',
              )}
            </p>
          </div>
          <div className="grid">
            <figure className="frame frame--photo span-6">
              <img
                className="frame__img"
                src="/assets/shots/photo-f2162506-960.jpg"
                srcSet="/assets/shots/photo-f2162506-500.jpg 500w, /assets/shots/photo-f2162506-960.jpg 960w"
                sizes="(max-width: 1023px) 100vw, 50vw"
                width={960}
                height={722}
                alt={t(
                  'Moving heads on stands throwing beams across a covered stage',
                  'Moving heads σε βάσεις ρίχνουν δέσμες φωτός σε μια στεγασμένη σκηνή',
                )}
                loading="lazy"
                data-source="stand-in"
                data-subject="fixtures lit"
              />
            </figure>
            <figure className="frame frame--photo span-6">
              <img
                className="frame__img"
                src="/assets/shots/photo-f116189302-960.jpg"
                srcSet="/assets/shots/photo-f116189302-500.jpg 500w, /assets/shots/photo-f116189302-960.jpg 960w"
                sizes="(max-width: 1023px) 100vw, 50vw"
                width={960}
                height={640}
                alt={t(
                  'The faders of a digital mixing console, lit, seen along the desk',
                  'Τα fader μιας ψηφιακής κονσόλας ήχου, φωτισμένα, από το πλάι',
                )}
                loading="lazy"
                data-source="stand-in"
                data-subject="the desk"
              />
            </figure>
          </div>
        </div>
      </section>

      <section className="section" id="questions" style={{ '--h': 1 } as React.CSSProperties} aria-labelledby="q-h">
        <div className="wrap grid">
          <div className="span-5">
            <div className="section-head">
              <h2 id="q-h">{t('Questions', 'Ερωτήσεις')}</h2>
            </div>
            <Link className="link" to="/contact">
              {t('Ask something else', 'Ρωτήστε κάτι άλλο')}
            </Link>
          </div>
          <div className="faq span-6 start-7">
            <div className="faq__item">
              <h3>{t('Why can I not see prices?', 'Γιατί δεν βλέπω τιμές;')}</h3>
              <p>
                {t(
                  'Prices are for approved trade accounts. Applying opens the whole catalogue.',
                  'Οι τιμές είναι για εγκεκριμένους λογαριασμούς χονδρικής. Κάντε αίτηση με τα στοιχεία της εταιρείας σας· η έγκριση ανοίγει κάθε τιμή του καταλόγου.',
                )}
              </p>
            </div>
            <div className="faq__item">
              <h3>{t('How long does a screen take?', 'Πόσο χρόνο θέλει μια οθόνη;')}</h3>
              <p>
                {t(
                  'Three to four weeks indoors, four to five outdoors. The Flex P2.9 ships in a week.',
                  'Τρεις έως τέσσερις εβδομάδες για εσωτερικό χώρο, τέσσερις έως πέντε για εξωτερικό. Το Flex P2.9 είναι σε στοκ και φεύγει μέσα σε μία εβδομάδα.',
                )}
              </p>
            </div>
            <div className="faq__item">
              <h3>{t('What is the deposit on an order?', 'Πόση είναι η προκαταβολή σε μια παραγγελία;')}</h3>
              <p>
                {t(
                  'Half the total when SLS accepts the order; the balance when the job is finished.',
                  'Το μισό του συνόλου όταν η SLS αποδεχθεί την παραγγελία· το υπόλοιπο όταν ολοκληρωθεί η δουλειά.',
                )}
              </p>
            </div>
            <div className="faq__item">
              <h3>{t('Do the prices include VAT?', 'Οι τιμές περιλαμβάνουν ΦΠΑ;')}</h3>
              <p>
                {t(
                  'No. Prices are ex VAT; Greek VAT of 24% is added on the order.',
                  'Όχι. Οι τιμές του καταλόγου είναι χωρίς ΦΠΑ· ο ελληνικός ΦΠΑ 24% προστίθεται στην παραγγελία.',
                )}
              </p>
            </div>
            <div className="faq__item">
              <h3>{t('Can an order be changed?', 'Μπορεί να αλλάξει μια παραγγελία;')}</h3>
              <p>
                {t(
                  'Until SLS accepts it, yes. After that a change is repriced and sent back to you.',
                  'Μέχρι να την αποδεχθεί η SLS, ναι. Μετά μια αλλαγή επανατιμολογείται και επιστρέφει σε εσάς για αποδοχή.',
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

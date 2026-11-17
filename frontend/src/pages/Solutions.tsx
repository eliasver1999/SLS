import { Link } from 'react-router-dom'
import { useLang } from '../context/language'

/**
 * The three ranges, one section each, each with the photograph of its own
 * kind of kit and the figures from src/data/products.ts.
 *
 * It used to be three icon cards and a paragraph of adjectives each. The
 * figures were already in the catalogue; they say more than the adjectives
 * did, so they are what is on the page now.
 */
export default function Solutions() {
  const { t } = useLang()

  return (
    <>
      <section className="hero hero--product" data-enter aria-labelledby="ranges-h">
        <div className="wrap">
          <div className="hero-text hero__in">
            <div className="hero__head">
              <div>
                <h1 id="ranges-h">{t('The three ranges', 'Οι τρεις σειρές')}</h1>
                <p className="hero__lead">
                  {t(
                    'Screens, lighting and sound, from the same catalogue and on the same order. Six models in all, each with its figures and its lead time.',
                    'Οθόνες, φωτισμός και ήχος, από τον ίδιο κατάλογο και στην ίδια παραγγελία. Έξι μοντέλα συνολικά, το καθένα με τα μεγέθη του και τον χρόνο παράδοσής του.',
                  )}
                </p>
              </div>
              <div className="btn-row">
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
                  'Rows of moving-head fixtures clamped to aluminium truss in a warehouse',
                  'Σειρές από moving head στερεωμένα σε αλουμινένιο truss σε αποθήκη',
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

      <section className="section" id="screens" aria-labelledby="scr-h">
        <div className="wrap grid">
          <div className="span-5">
            <div className="section-head">
              <h2 id="scr-h">{t('LED walls, indoors and out', 'LED τοίχοι, μέσα και έξω')}</h2>
              <p>
                {t(
                  'The Aurora P2.6 is the fine-pitch indoor wall at 1500 nits, for stages, studios and shop windows people stand close to. The Titan P3.9 is weatherproof and runs at 5000 nits, which is what daylight costs.',
                  'Το Aurora P2.6 είναι ο εσωτερικός τοίχος λεπτού pitch στα 1500 nits, για σκηνές, στούντιο και βιτρίνες όπου ο κόσμος στέκεται κοντά. Το Titan P3.9 είναι στεγανό και δουλεύει στα 5000 nits, όσο κοστίζει το φως της ημέρας.',
                )}
              </p>
            </div>
            <p className="t-body">
              {t(
                'The Flex P2.9 curves to ±15° on 500 × 1000 mm panels, and it is the one model held in stock.',
                'Το Flex P2.9 κυρτώνει έως ±15° σε panels 500 × 1000 mm και είναι το μόνο μοντέλο που κρατείται σε στοκ.',
              )}
            </p>
            <p>
              <Link className="link" to="/catalogue?cat=screens">
                {t('See the three screens', 'Δείτε τις τρεις οθόνες')}
              </Link>
            </p>
          </div>
          <figure
            className="frame frame--photo span-6 start-7"
            style={{ '--ratio': '80%' } as React.CSSProperties}
          >
            <img
              className="frame__img"
              src="/assets/shots/photo-f167000710-960.jpg"
              srcSet="/assets/shots/photo-f167000710-500.jpg 500w, /assets/shots/photo-f167000710-960.jpg 960w"
              sizes="(max-width: 1023px) 100vw, 50vw"
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
        </div>
      </section>

      <section className="photo-band photo-band--bleed" aria-labelledby="lit-h">
        <img
          src="/assets/shots/photo-f2162506-960.jpg"
          srcSet="/assets/shots/photo-f2162506-500.jpg 500w, /assets/shots/photo-f2162506-960.jpg 960w"
          sizes="100vw"
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
        <div className="photo-band__text">
          <h2 id="lit-h">{t('Moving heads on DMX-512', 'Moving heads σε DMX-512')}</h2>
          <p>
            {t(
              'The Beam 380 is the lighting range: 380 W, 19 kg in the clamp, two to three weeks to build.',
              'Το Beam 380 είναι η σειρά φωτισμού: 380 W, 19 kg στο clamp, δύο έως τρεις εβδομάδες κατασκευή.',
            )}
          </p>
          <Link className="link" to="/catalogue?cat=lighting">
            {t('See the lighting', 'Δείτε τον φωτισμό')}
          </Link>
        </div>
      </section>

      <section className="section" id="sound" aria-labelledby="snd-h">
        <div className="wrap grid">
          <div className="span-5">
            <div className="section-head">
              <h2 id="snd-h">{t('Line array, bi-amped', 'Line array, bi-amped')}</h2>
              <p>
                {t(
                  'The LA-12 carries two 12-inch drivers to a box and is bi-amped, 140 dB at maximum. It is tuned to the space it hangs in rather than shipped flat.',
                  'Το LA-12 έχει δύο μεγάφωνα δώδεκα ιντσών ανά κιβώτιο και είναι bi-amped, 140 dB στο μέγιστο. Ρυθμίζεται στον χώρο όπου αναρτάται και δεν στέλνεται έτοιμο.',
                )}
              </p>
            </div>
            <p>
              <Link className="link" to="/catalogue?cat=sound">
                {t('See the sound', 'Δείτε τον ήχο')}
              </Link>
            </p>
          </div>
          <figure
            className="frame frame--photo span-6 start-7"
            style={{ '--ratio': '125%' } as React.CSSProperties}
          >
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

      <section className="section" id="package" aria-labelledby="pkg-h">
        <div className="wrap">
          <div className="section-head">
            <h2 id="pkg-h">{t('One package for a small stage', 'Ένα πακέτο για μικρή σκηνή')}</h2>
            <p>
              {t(
                'Stage Kit S is twelve square metres of wall, eight moving heads and a 2 kW PA, delivered and set up with an operator for the day. Price on request.',
                'Το Stage Kit S είναι δώδεκα τετραγωνικά μέτρα οθόνης, οκτώ moving heads και PA 2 kW, με παράδοση και εγκατάσταση και χειριστή για την ημέρα. Τιμή κατόπιν αιτήματος.',
              )}
            </p>
          </div>
          <div className="grid">
            <figure className="frame frame--photo span-6">
              <img
                className="frame__img"
                src="/assets/shots/photo-f181466405-960.jpg"
                srcSet="/assets/shots/photo-f181466405-500.jpg 500w, /assets/shots/photo-f181466405-960.jpg 960w"
                sizes="(max-width: 1023px) 100vw, 50vw"
                width={960}
                height={720}
                alt={t(
                  'Two foam-lined flight cases open on a yard, the way fixtures travel',
                  'Δύο flight cases με αφρολέξ ανοιχτά σε μια αυλή, έτσι ταξιδεύουν τα φωτιστικά',
                )}
                loading="lazy"
                data-source="stand-in"
                data-subject="flight cases"
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
    </>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import Eq, { HERO_EQ, BAND_EQ } from '../components/Eq'
import ProductCard from '../components/ProductCard'
import { FEATURED, type Product } from '../data/products'
import { fetchProducts } from '../lib/api'

export default function Home() {
  const { t } = useLang()
  // Static featured list is the initial paint + offline fallback; the API is
  // the source of truth once it responds.
  const [featured, setFeatured] = useState<Product[]>(FEATURED)
  useEffect(() => {
    fetchProducts({ featured: true })
      .then((p) => p.length && setFeatured(p))
      .catch(() => {})
  }, [])

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="bg">
          <img src="/assets/hero-stage.jpg" alt="" />
        </div>
        <div className="container">
          <div className="hero-inner">
            <div className="eyebrow">
              {t('Premium Event Technology', 'Premium Τεχνολογία Εκδηλώσεων')}
            </div>
            <h1 className="h1">
              {t('Where your event comes to light.', 'Εκεί που η εκδήλωσή σας παίρνει φως.')}
            </h1>
            <p className="lead">
              {t(
                'Buy or rent premium LED screens, stage lighting and professional sound — supplied direct and set up as a full service, with local accountability.',
                'Αγοράστε ή ενοικιάστε premium LED οθόνες, φωτισμό σκηνής και επαγγελματικό ήχο — απευθείας προμήθεια και ολοκληρωμένη εγκατάσταση, με τοπική υπευθυνότητα.',
              )}
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary" to="/catalogue">
                {t('Explore the catalogue', 'Δείτε τον κατάλογο')}
              </Link>
              <Link className="btn btn-ghost" to="/apply">
                {t('Apply for B2B access', 'Αίτηση B2B πρόσβασης')}
              </Link>
            </div>
            <Eq heights={HERO_EQ} />
          </div>
        </div>
      </section>

      {/* TRUST */}
      <div className="trust">
        <div className="container">
          <div className="item">
            <span className="ic">◆</span>
            <span>
              <b>{t('Direct', 'Απευθείας')}</b> {t('pricing', 'τιμές')}
            </span>
          </div>
          <div className="item">
            <span className="ic">⧉</span>
            <span>
              <b>{t('End-to-end', 'Από άκρο σε άκρο')}</b> {t('one partner', 'ένας συνεργάτης')}
            </span>
          </div>
          <div className="item">
            <span className="ic">⚙</span>
            <span>
              <b>{t('Made-to-order', 'Κατά παραγγελία')}</b> {t('& reliable', '& αξιόπιστο')}
            </span>
          </div>
          <div className="item">
            <span className="ic">◷</span>
            <span>
              <b>{t('On-site', 'Επιτόπου')}</b> {t('delivery & setup', 'παράδοση & εγκατάσταση')}
            </span>
          </div>
          <div className="item">
            <span className="ic">✓</span>
            <span>
              <b>WCAG AA</b> {t('accessible', 'προσβάσιμο')}
            </span>
          </div>
        </div>
      </div>

      {/* SOLUTIONS */}
      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div>
              <div className="eyebrow">{t('Solutions', 'Λύσεις')}</div>
              <h2 className="h2 mt8">
                {t('Three capabilities, one partner', 'Τρεις δυνατότητες, ένας συνεργάτης')}
              </h2>
            </div>
            <Link className="btn btn-ghost btn-sm" to="/solutions">
              {t('All solutions →', 'Όλες οι λύσεις →')}
            </Link>
          </div>
          <div className="grid g3">
            <div className="feature">
              <div className="ic">
                <img src="/assets/icon-screens.png" style={{ width: 28 }} alt="" />
              </div>
              <h3>{t('Screens', 'Οθόνες')}</h3>
              <p>
                {t(
                  'LED screens & video walls — indoor, outdoor and rental. Fine pixel pitches, high brightness.',
                  'LED οθόνες & video walls — εσωτερικού, εξωτερικού χώρου και ενοικίασης. Λεπτό pixel pitch, υψηλή φωτεινότητα.',
                )}
              </p>
            </div>
            <div className="feature">
              <div className="ic">
                <img src="/assets/icon-lights.png" style={{ width: 26 }} alt="" />
              </div>
              <h3>{t('Lighting', 'Φωτισμός')}</h3>
              <p>
                {t(
                  'Stage, architectural and event lighting that sets the mood and moves the room.',
                  'Φωτισμός σκηνής, αρχιτεκτονικός και εκδηλώσεων που δημιουργεί ατμόσφαιρα.',
                )}
              </p>
            </div>
            <div className="feature">
              <div className="ic">
                <img src="/assets/icon-sound.png" style={{ width: 30 }} alt="" />
              </div>
              <h3>{t('Sound', 'Ήχος')}</h3>
              <p>
                {t(
                  'Professional audio systems and set-up for live events and venues, tuned to the space.',
                  'Επαγγελματικά ηχητικά συστήματα και εγκατάσταση για live events και χώρους.',
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head">
            <div>
              <div className="eyebrow">{t('Catalogue', 'Κατάλογος')}</div>
              <h2 className="h2 mt8">{t('Featured products', 'Επιλεγμένα προϊόντα')}</h2>
              <p className="lead">
                {t(
                  'Full specs are open to everyone. Pricing unlocks for approved B2B partners.',
                  'Οι πλήρεις προδιαγραφές είναι ανοιχτές. Οι τιμές ξεκλειδώνουν για εγκεκριμένους B2B συνεργάτες.',
                )}
              </p>
            </div>
          </div>
          <div className="grid g4 mt24">
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* WHY SLS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head">
            <div>
              <div className="eyebrow">{t('Why SLS', 'Γιατί SLS')}</div>
              <h2 className="h2 mt8">
                {t('Premium, direct and accountable', 'Premium, απευθείας και υπεύθυνο')}
              </h2>
            </div>
          </div>
          <div className="grid g3">
            <div className="feature">
              <div className="ic">◆</div>
              <h3>{t('Direct from source', 'Απευθείας από την πηγή')}</h3>
              <p>
                {t(
                  'Premium screens at direct pricing — quality without the mark-up.',
                  'Premium οθόνες σε τιμές απευθείας — ποιότητα χωρίς προσαυξήσεις.',
                )}
              </p>
            </div>
            <div className="feature">
              <div className="ic">⧉</div>
              <h3>{t('One partner, end-to-end', 'Ένας συνεργάτης, από την αρχή ως το τέλος')}</h3>
              <p>
                {t(
                  'Sound, lights and screens from one accountable team.',
                  'Ήχος, φώτα και οθόνες από μία υπεύθυνη ομάδα.',
                )}
              </p>
            </div>
            <div className="feature">
              <div className="ic">⚙</div>
              <h3>{t('Made-to-order & reliable', 'Κατά παραγγελία & αξιόπιστο')}</h3>
              <p>
                {t(
                  'Quality builds to spec, delivered with precision and care.',
                  'Κατασκευές κατά παραγγελία, με ακρίβεια και φροντίδα.',
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RENTALS BAND */}
      <section className="section-sm">
        <div className="container">
          <div className="band">
            <Eq heights={BAND_EQ} lg />
            <div className="eyebrow">{t('Rentals', 'Ενοικιάσεις')}</div>
            <h2 className="h2 mt8">
              {t('Rent for your next event', 'Ενοικιάστε για την επόμενη εκδήλωσή σας')}
            </h2>
            <p className="lead mt8">
              {t(
                'Date-based availability, delivery and on-site setup. Screens, lighting and sound by the day.',
                'Διαθεσιμότητα βάσει ημερομηνιών, παράδοση και επιτόπου εγκατάσταση.',
              )}
            </p>
            <Link className="btn btn-primary mt24" to="/product/flex-p29?mode=rent">
              {t('Check availability', 'Έλεγχος διαθεσιμότητας')}
            </Link>
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head">
            <div>
              <div className="eyebrow">{t('Projects', 'Έργα')}</div>
              <h2 className="h2 mt8">{t('The brand as the show', 'Το brand ως το σόου')}</h2>
            </div>
            <Link className="btn btn-ghost btn-sm" to="/projects">
              {t('View portfolio →', 'Δείτε το portfolio →')}
            </Link>
          </div>
          <div className="grid g4">
            {['one-partner.jpg', 'hero-stage.jpg', 'led-wall.jpg', 'meet.jpg'].map((img) => (
              <div className="card" key={img}>
                <div className="thumb" style={{ aspectRatio: '1/1' }}>
                  <img src={`/assets/${img}`} alt="" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER CTA */}
      <section className="section-sm">
        <div className="container">
          <div
            className="band"
            style={{ background: 'linear-gradient(120deg,#0c1c39,#0a1424)', textAlign: 'center' }}
          >
            <div className="eyebrow center">{t('Become a Partner', 'Γίνετε Συνεργάτης')}</div>
            <h2 className="h2 mt8" style={{ margin: '0 auto' }}>
              {t('Unlock B2B pricing & booking', 'Ξεκλειδώστε B2B τιμές & κρατήσεις')}
            </h2>
            <p className="lead mt8" style={{ margin: '8px auto 0' }}>
              {t(
                'Apply in two minutes. Approved businesses see pricing, buy made-to-order and book rentals.',
                'Κάντε αίτηση σε δύο λεπτά. Οι εγκεκριμένες επιχειρήσεις βλέπουν τιμές, αγοράζουν κατά παραγγελία και κάνουν κρατήσεις.',
              )}
            </p>
            <div className="cta-row" style={{ justifyContent: 'center' }}>
              <Link className="btn btn-primary mt24" to="/apply">
                {t('Apply for access', 'Αίτηση πρόσβασης')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

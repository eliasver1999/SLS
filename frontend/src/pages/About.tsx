import { Link } from 'react-router-dom'
import { useLang } from '../context/language'

const PERSONALITY: { en: [string, string]; el: [string, string] }[] = [
  { en: ['Premium', 'high-end, never cheap'], el: ['Premium', 'υψηλή ποιότητα, ποτέ φθηνό'] },
  { en: ['Precise', 'technical mastery you trust'], el: ['Ακριβές', 'τεχνική δεινότητα που εμπιστεύεστε'] },
  { en: ['Energetic', 'built for the stage'], el: ['Ενεργητικό', 'φτιαγμένο για τη σκηνή'] },
  { en: ['Welcoming', 'exclusive yet approachable'], el: ['Φιλόξενο', 'αποκλειστικό αλλά προσιτό'] },
]

const AUDIENCE: {
  tier: [string, string]
  label: [string, string]
  items: [string, string][]
}[] = [
  {
    tier: ['Primary', 'Πρωτεύον'],
    label: ['Premium', 'Premium'],
    items: [
      ['Music: concerts, festivals, tours, stage backdrops', 'Μουσική: συναυλίες, φεστιβάλ, περιοδείες, σκηνικά'],
      ['Brand marketing & experiential events', 'Brand marketing & experiential events'],
      ['Venues packaging screens as a service — weddings, galas, corporate', 'Χώροι που προσφέρουν οθόνες ως υπηρεσία — γάμοι, γκαλά, εταιρικά'],
      ['Stadiums and arenas', 'Στάδια και αρένες'],
    ],
  },
  {
    tier: ['Secondary', 'Δευτερεύον'],
    label: ['Volume', 'Όγκος'],
    items: [
      ['Retail businesses wanting an in-store LED screen', 'Καταστήματα που θέλουν LED οθόνη'],
      ['Shops playing their own ads and promotions', 'Καταστήματα που προβάλλουν διαφημίσεις τους'],
      ['Local, repeatable, entry-level orders', 'Τοπικές, επαναλαμβανόμενες παραγγελίες'],
    ],
  },
]

export default function About() {
  const { t, lang } = useLang()
  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Home / {t('About', 'Σχετικά')}</div>
          <div className="eyebrow">{t('The Brand', 'Το Brand')}</div>
          <h1 className="h2 mt8">Sound. Lights. Screens.</h1>
          <p className="lead mt8">
            {t(
              'SLS is a premium event-technology brand supplying LED screens & video walls, stage lighting, and sound systems to the events, music, and premium-brand world.',
              'Η SLS είναι ένα premium brand τεχνολογίας εκδηλώσεων που προμηθεύει LED οθόνες & video walls, φωτισμό σκηνής και ηχητικά συστήματα στον κόσμο των events, της μουσικής και των premium brands.',
            )}
          </p>
        </div>
      </div>

      {/* Mission + image */}
      <section className="section">
        <div className="container grid g2" style={{ alignItems: 'center', gap: 40 }}>
          <div>
            <div className="eyebrow">{t('Our mission', 'Η αποστολή μας')}</div>
            <p className="h2 mt16" style={{ fontSize: 30 }}>
              {t(
                'To power unforgettable moments with brilliant, reliable visual and audio technology — delivered with precision and care.',
                'Να τροφοδοτούμε αξέχαστες στιγμές με λαμπερή, αξιόπιστη τεχνολογία εικόνας και ήχου — με ακρίβεια και φροντίδα.',
              )}
            </p>
          </div>
          <div className="card">
            <div className="thumb" style={{ aspectRatio: '4/3' }}>
              <img src="/assets/meet.jpg" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* Personality */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head">
            <div>
              <div className="eyebrow">{t('Brand personality', 'Χαρακτήρας brand')}</div>
              <h2 className="h2 mt8">{t('How we show up', 'Πώς εμφανιζόμαστε')}</h2>
            </div>
          </div>
          <div className="grid g4">
            {PERSONALITY.map((p) => {
              const [word, note] = lang === 'el' ? p.el : p.en
              return (
                <div className="feature" key={word}>
                  <h3 style={{ color: 'var(--sky)' }}>{word}</h3>
                  <p>{note}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Positioning band */}
      <section className="section-sm">
        <div className="container">
          <div className="band" style={{ textAlign: 'center' }}>
            <div className="eyebrow center">{t('Positioning', 'Τοποθέτηση')}</div>
            <h2 className="h2 mt8" style={{ margin: '8px auto 0' }}>
              {t(
                'For clients who demand impact, SLS delivers premium screens, lighting and sound — direct-source value with the accountability of a trusted local partner.',
                'Για πελάτες που απαιτούν impact, η SLS προσφέρει premium οθόνες, φωτισμό και ήχο — αξία απευθείας από την πηγή με την υπευθυνότητα ενός έμπιστου τοπικού συνεργάτη.',
              )}
            </h2>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sec-head">
            <div>
              <div className="eyebrow">{t('Positioning & audience', 'Τοποθέτηση & κοινό')}</div>
              <h2 className="h2 mt8">{t('Who we sell to', 'Σε ποιους απευθυνόμαστε')}</h2>
            </div>
          </div>
          <div className="grid g2">
            {AUDIENCE.map((group) => {
              const tier = lang === 'el' ? group.tier[1] : group.tier[0]
              const label = lang === 'el' ? group.label[1] : group.label[0]
              return (
                <div className="panel" key={tier}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                    <span className="eyebrow">{tier}</span>
                    <span className="status blue">{label}</span>
                  </div>
                  <table className="spec-table">
                    <tbody>
                      {group.items.map((it, i) => (
                        <tr key={i}>
                          <td colSpan={2} style={{ width: 'auto', color: '#cdd8e6' }}>
                            {lang === 'el' ? it[1] : it[0]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-sm">
        <div className="container">
          <div
            className="band"
            style={{ background: 'linear-gradient(120deg,#0c1c39,#0a1424)', textAlign: 'center' }}
          >
            <div className="eyebrow center">{t('Work with SLS', 'Συνεργαστείτε με τη SLS')}</div>
            <h2 className="h2 mt8" style={{ margin: '0 auto' }}>
              {t('Where your event comes to light', 'Εκεί που η εκδήλωσή σας παίρνει φως')}
            </h2>
            <div className="cta-row" style={{ justifyContent: 'center' }}>
              <Link className="btn btn-primary mt24" to="/contact">
                {t('Get in touch', 'Επικοινωνήστε')}
              </Link>
              <Link className="btn btn-ghost mt24" to="/solutions">
                {t('See our solutions', 'Δείτε τις λύσεις μας')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

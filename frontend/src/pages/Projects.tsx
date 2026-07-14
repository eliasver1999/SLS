import { Link } from 'react-router-dom'
import { useLang } from '../context/language'

type Project = {
  img: string
  title: [string, string]
  tag: [string, string]
  blurb: [string, string]
}

const PROJECTS: Project[] = [
  {
    img: '/assets/hero-stage.jpg',
    tag: ['Festival', 'Φεστιβάλ'],
    title: ['Main-stage LED backdrop', 'LED σκηνικό κεντρικής σκηνής'],
    blurb: ['A 120 m² outdoor wall, stage wash and line-array for a 12k crowd.', 'Οθόνη 120 m², φωτισμός σκηνής και line-array για 12.000 θεατές.'],
  },
  {
    img: '/assets/led-wall.jpg',
    tag: ['Corporate', 'Εταιρικό'],
    title: ['Keynote & product launch', 'Keynote & λανσάρισμα προϊόντος'],
    blurb: ['Fine-pitch indoor wall with full FOH sound for an 800-guest launch.', 'Εσωτερική οθόνη λεπτού pitch με πλήρη ήχο FOH για λανσάρισμα 800 ατόμων.'],
  },
  {
    img: '/assets/one-partner.jpg',
    tag: ['Package', 'Πακέτο'],
    title: ['Turnkey stage build', 'Ολοκληρωμένη σκηνή'],
    blurb: ['Screen, lighting and sound delivered and operated by one team.', 'Οθόνη, φωτισμός και ήχος με παράδοση και χειρισμό από μία ομάδα.'],
  },
  {
    img: '/assets/lighting.jpg',
    tag: ['Concert', 'Συναυλία'],
    title: ['Touring lighting rig', 'Rig φωτισμού περιοδείας'],
    blurb: ['Programmed moving-head show, tour-ready and rehearsed on site.', 'Προγραμματισμένο show με moving heads, έτοιμο για περιοδεία.'],
  },
  {
    img: '/assets/sound.jpg',
    tag: ['Venue', 'Χώρος'],
    title: ['Permanent PA install', 'Μόνιμη εγκατάσταση PA'],
    blurb: ['Line-array system tuned to the room for a live-music venue.', 'Σύστημα line-array ρυθμισμένο στον χώρο για venue ζωντανής μουσικής.'],
  },
  {
    img: '/assets/catalogue.jpg',
    tag: ['Retail', 'Λιανική'],
    title: ['In-store LED display', 'LED οθόνη καταστήματος'],
    blurb: ['An always-on storefront screen for ads and promotions.', 'Οθόνη βιτρίνας πάντα ενεργή για διαφημίσεις και προσφορές.'],
  },
]

export default function Projects() {
  const { t, lang } = useLang()
  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Home / {t('Projects', 'Έργα')}</div>
          <div className="eyebrow">{t('Projects', 'Έργα')}</div>
          <h1 className="h2 mt8">{t('The brand as the show', 'Το brand ως το σόου')}</h1>
          <p className="lead mt8">
            {t(
              'A selection of screens, lighting and sound we have supplied and set up — from festival main stages to in-store displays.',
              'Μια επιλογή από οθόνες, φωτισμό και ήχο που προμηθεύσαμε και εγκαταστήσαμε — από κεντρικές σκηνές φεστιβάλ μέχρι οθόνες καταστημάτων.',
            )}
          </p>
        </div>
      </div>

      <section className="section-sm">
        <div className="container">
          <div className="grid g3">
            {PROJECTS.map((p) => (
              <div className="card" key={p.title[0]}>
                <div className="thumb">
                  <img src={p.img} alt="" />
                  <span className="tag">{lang === 'el' ? p.tag[1] : p.tag[0]}</span>
                </div>
                <div className="body">
                  <h3>{lang === 'el' ? p.title[1] : p.title[0]}</h3>
                  <p className="muted mt8" style={{ fontSize: 14 }}>
                    {lang === 'el' ? p.blurb[1] : p.blurb[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <div
            className="band"
            style={{ background: 'linear-gradient(120deg,#0c1c39,#0a1424)', textAlign: 'center' }}
          >
            <h2 className="h2" style={{ margin: '0 auto' }}>
              {t('Planning something similar?', 'Σχεδιάζετε κάτι παρόμοιο;')}
            </h2>
            <p className="lead mt8" style={{ margin: '8px auto 0' }}>
              {t(
                'Tell us the venue and dates — we design the screen, light and sound package.',
                'Πείτε μας τον χώρο και τις ημερομηνίες — σχεδιάζουμε το πακέτο οθόνης, φωτός και ήχου.',
              )}
            </p>
            <Link className="btn btn-primary mt24" to="/contact">
              {t('Start a project', 'Ξεκινήστε ένα έργο')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

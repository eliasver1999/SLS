import { Link } from 'react-router-dom'
import { useLang } from '../context/language'

export default function Solutions() {
  const { t } = useLang()

  const ChipRow = ({ chips }: { chips: string[] }) => (
    <div className="mt16">
      {chips.map((c) => (
        <span className="chip on" key={c}>
          {c}
        </span>
      ))}
    </div>
  )

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Home / {t('Solutions', 'Λύσεις')}</div>
          <div className="eyebrow">{t('Solutions', 'Λύσεις')}</div>
          <h1 className="h2 mt8">
            {t(
              'Screens, lighting & sound — one accountable partner',
              'Οθόνες, φωτισμός & ήχος — ένας υπεύθυνος συνεργάτης',
            )}
          </h1>
          <p className="lead mt8">
            {t(
              'From a single LED wall to a full stage build, we supply direct and set up on site.',
              'Από μία LED οθόνη μέχρι πλήρη σκηνή, προμηθεύουμε απευθείας και εγκαθιστούμε επιτόπου.',
            )}
          </p>
        </div>
      </div>

      <section className="section">
        <div className="container grid" style={{ gap: 26 }}>
          {/* Screens */}
          <div className="card split split-stretch">
            <div className="thumb" style={{ aspectRatio: 'auto' }}>
              <img src="/assets/led-wall.jpg" style={{ height: '100%' }} alt="" />
            </div>
            <div className="body" style={{ padding: 34 }}>
              <div
                className="ic"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(31,139,255,.14)',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: 14,
                }}
              >
                <img src="/assets/icon-screens.png" style={{ width: 26 }} alt="" />
              </div>
              <h2 className="h2" style={{ fontSize: 28 }}>
                {t('LED Screens & Video Walls', 'LED Οθόνες & Video Walls')}
              </h2>
              <p className="muted mt8">
                {t(
                  'Indoor and outdoor. Fine pixel pitches, high brightness, seamless modular builds.',
                  'Εσωτερικού και εξωτερικού χώρου. Λεπτό pixel pitch, υψηλή φωτεινότητα, modular κατασκευές κάθε μεγέθους.',
                )}
              </p>
              <ChipRow chips={['Indoor', 'Outdoor', 'P1.5–P10']} />
              <Link className="btn btn-primary btn-sm mt24" to="/catalogue">
                {t('Browse screens →', 'Δείτε οθόνες →')}
              </Link>
            </div>
          </div>

          {/* Lighting */}
          <div
            className="card split split-stretch-alt"
          >
            <div className="body" style={{ padding: 34 }}>
              <div
                className="ic"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(31,139,255,.14)',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: 14,
                }}
              >
                <img src="/assets/icon-lights.png" style={{ width: 24 }} alt="" />
              </div>
              <h2 className="h2" style={{ fontSize: 28 }}>
                {t('Stage & Event Lighting', 'Φωτισμός Σκηνής & Εκδηλώσεων')}
              </h2>
              <p className="muted mt8">
                {t(
                  'Moving heads, wash, beam and architectural fixtures — programmed to move the room.',
                  'Moving heads, wash, beam και αρχιτεκτονικά σώματα — προγραμματισμένα για ατμόσφαιρα.',
                )}
              </p>
              <ChipRow chips={[t('Moving head', 'Moving head'), 'Wash', 'Beam', t('Control', 'Έλεγχος')]} />
              <Link className="btn btn-primary btn-sm mt24" to="/catalogue">
                {t('Browse lighting →', 'Δείτε φωτισμό →')}
              </Link>
            </div>
            <div className="thumb" style={{ aspectRatio: 'auto' }}>
              <img src="/assets/lighting.jpg" style={{ height: '100%' }} alt="" />
            </div>
          </div>

          {/* Sound */}
          <div
            className="card split split-stretch"
          >
            <div className="thumb" style={{ aspectRatio: 'auto' }}>
              <img src="/assets/sound.jpg" style={{ height: '100%' }} alt="" />
            </div>
            <div className="body" style={{ padding: 34 }}>
              <div
                className="ic"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(31,139,255,.14)',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: 14,
                }}
              >
                <img src="/assets/icon-sound.png" style={{ width: 28 }} alt="" />
              </div>
              <h2 className="h2" style={{ fontSize: 28 }}>
                {t('Professional Sound Systems', 'Επαγγελματικά Ηχητικά Συστήματα')}
              </h2>
              <p className="muted mt8">
                {t(
                  'Line-array and point-source systems, monitoring and full FOH set-up, tuned to the space.',
                  'Συστήματα line-array και point-source, monitoring και πλήρες FOH στήσιμο, ρυθμισμένα στον χώρο.',
                )}
              </p>
              <ChipRow chips={['Line-array', 'Monitors', 'FOH', t('Tuning', 'Ρύθμιση')]} />
              <Link className="btn btn-primary btn-sm mt24" to="/catalogue">
                {t('Browse sound →', 'Δείτε ήχο →')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div
            className="band"
            style={{ textAlign: 'center', background: 'linear-gradient(120deg,#0c1c39,#0a1424)' }}
          >
            <h2 className="h2" style={{ margin: '0 auto' }}>
              {t('Planning a custom project?', 'Σχεδιάζετε custom έργο;')}
            </h2>
            <p className="lead mt8" style={{ margin: '8px auto 0' }}>
              {t(
                "Tell us the venue and dates — we'll design the screen, light and sound package.",
                'Πείτε μας τον χώρο και τις ημερομηνίες — σχεδιάζουμε το πακέτο οθόνης, φωτός και ήχου.',
              )}
            </p>
            <Link className="btn btn-primary mt24" to="/apply">
              {t('Request a consultation', 'Ζητήστε συμβουλευτική')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

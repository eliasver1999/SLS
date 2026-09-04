import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../context/language'
import { Check, Hash } from 'lucide-react'

export default function OrderReceived() {
  const { t } = useLang()
  const { state } = useLocation()
  const reference = (state as { reference?: string } | null)?.reference ?? 'SLS-ORD-50231'
  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">
            Home / {t('Catalogue', 'Κατάλογος')} / {t('Request received', 'Το αίτημα ελήφθη')}
          </div>
        </div>
      </div>

      <section className="section-sm">
        <div className="container" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="form center">
            <div
              className="ic"
              style={{
                width: 66,
                height: 66,
                borderRadius: '50%',
                background: 'rgba(31,139,255,.16)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 18px',
                color: 'var(--sky)',
                fontSize: 30,
                boxShadow: 'var(--glow)',
              }}
            >
              <Check size={32} aria-hidden />
            </div>
            <div className="eyebrow center">{t('Request received', 'Το αίτημα ελήφθη')}</div>
            <h1 className="h2 mt8">
              {t('Thank you for your order', 'Ευχαριστούμε για την παραγγελία σας')}
            </h1>
            <p className="lead mt8" style={{ margin: '8px auto 0' }}>
              {t(
                'No payment is taken on the website. Our team will email you shortly to finalise the paperwork — a Scope of Work (SOW) for purchases — and to send your invoice for payment by bank transfer (IBAN). We review requests and reply within one business day.',
                'Δεν γίνεται καμία πληρωμή στον ιστότοπο. Η ομάδα μας θα σας στείλει σύντομα email για να ολοκληρώσουμε τα έγγραφα — ένα Scope of Work (SOW) για τις αγορές — και το τιμολόγιο για πληρωμή με τραπεζικό έμβασμα (IBAN). Ελέγχουμε τα αιτήματα και απαντάμε εντός μίας εργάσιμης ημέρας.',
              )}
            </p>

            <div style={{ display: 'grid', gap: 10, maxWidth: 460, margin: '24px auto 0', textAlign: 'left' }}>
              <div className="flow" style={{ gap: 10 }}>
                <div className="node blue">{t('1 · Request received', '1 · Το αίτημα ελήφθη')}</div>
                <span className="arw">→</span>
                <div className="node">
                  {t('2 · We email you the SOW to sign', '2 · Σας στέλνουμε το SOW για υπογραφή')}
                </div>
              </div>
              <div className="flow" style={{ gap: 10 }}>
                <div className="node">
                  {t('3 · Invoice by bank transfer (IBAN)', '3 · Τιμολόγιο με έμβασμα (IBAN)')}
                </div>
                <span className="arw">→</span>
                <div className="node">{t('4 · Production / delivery', '4 · Παραγωγή / παράδοση')}</div>
              </div>
            </div>

            <div className="notice mt24" style={{ textAlign: 'left' }}>
              <div className="ic"><Hash size={17} aria-hidden /></div>
              <div>
                <b>
                  {t('Reference: ', 'Αριθμός: ')}
                  {reference}
                </b>
                <br />
                <span className="muted" style={{ fontSize: 13.5 }}>
                  {t(
                    'A copy has been emailed to you. Questions? sales@sls.gr',
                    'Αντίγραφο στάλθηκε στο email σας. Ερωτήσεις; sales@sls.gr',
                  )}
                </span>
              </div>
            </div>

            <div className="cta-row" style={{ justifyContent: 'center', marginTop: 24 }}>
              <Link className="btn btn-primary" to="/dashboard">
                {t('Go to dashboard', 'Στον πίνακα ελέγχου')}
              </Link>
              <Link className="btn btn-ghost" to="/catalogue">
                {t('Back to catalogue', 'Πίσω στον κατάλογο')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

import { Link } from 'react-router-dom'
import { useLang } from '../context/language'

export default function Sitemap() {
  const { t } = useLang()
  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="eyebrow">{t('Information Architecture', 'Αρχιτεκτονική Πληροφορίας')}</div>
          <h1 className="h2 mt8">{t('Sitemap & user flows', 'Sitemap & ροές χρήστη')}</h1>
        </div>
      </div>

      <section className="section-sm">
        <div className="container">
          <div className="grid g3" style={{ alignItems: 'start' }}>
            <div className="panel">
              <div className="eyebrow">{t('Public · open to all', 'Δημόσιο · για όλους')}</div>
              <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                <Link className="node blue" to="/">
                  Home
                </Link>
                <Link className="node" to="/solutions">
                  {t('Solutions (Screens/Lighting/Sound)', 'Λύσεις (Οθόνες/Φωτισμός/Ήχος)')}
                </Link>
                <Link className="node" to="/catalogue">
                  {t('Catalogue — specs open, pricing hidden', 'Κατάλογος — προδιαγραφές ανοιχτές, τιμές κρυφές')}
                </Link>
                <Link className="node" to="/catalogue?mode=rent">
                  {t('Rentals', 'Ενοικιάσεις')}
                </Link>
                <Link className="node" to="/projects">
                  {t('Projects / Portfolio', 'Έργα / Portfolio')}
                </Link>
                <Link className="node" to="/about">
                  About
                </Link>
                <Link className="node" to="/contact">
                  Contact
                </Link>
                <Link className="node blue" to="/apply">
                  {t('Become a Partner', 'Γίνετε Συνεργάτης')}
                </Link>
                <Link className="node" to="/dashboard">
                  Login
                </Link>
                <Link className="node" to="/ui-kit">
                  UI Kit
                </Link>
              </div>
            </div>

            <div className="panel">
              <div className="eyebrow">
                {t('Gated B2B · approved only', 'B2B με πρόσβαση · μόνο εγκεκριμένοι')}
              </div>
              <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                <Link className="node blue" to="/dashboard">
                  Dashboard
                </Link>
                <Link className="node" to="/catalogue">
                  {t('Catalogue WITH pricing', 'Κατάλογος ΜΕ τιμές')}
                </Link>
                <Link className="node" to="/product/aurora-p26">
                  {t('Product detail (Buy / Rent)', 'Προϊόν (Αγορά / Ενοικίαση)')}
                </Link>
                <Link className="node" to="/product/aurora-p26#quote">
                  {t('Quote / Cart', 'Προσφορά / Καλάθι')}
                </Link>
                <Link className="node" to="/product/flex-p29?mode=rent">
                  {t('Rental booking', 'Κράτηση ενοικίασης')}
                </Link>
                <div className="node">{t('Orders & quotes history', 'Ιστορικό παραγγελιών')}</div>
                <div className="node">{t('Company profile', 'Προφίλ εταιρείας')}</div>
                <div className="node">Invoices</div>
              </div>
            </div>

            <div className="panel">
              <div className="eyebrow">Admin</div>
              <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                <Link className="node blue" to="/admin">
                  {t('Member approvals (approve/reject)', 'Εγκρίσεις μελών')}
                </Link>
                <div className="node">{t('Product management', 'Διαχείριση προϊόντων')}</div>
                <div className="node">
                  {t('Orders / quotes / rentals', 'Παραγγελίες / προσφορές / ενοικιάσεις')}
                </div>
              </div>
            </div>
          </div>

          <h3 className="head mt40" style={{ letterSpacing: 1, color: 'var(--grey)', fontSize: 14 }}>
            {t('FLOW 1 · ACCESS & APPROVAL', 'ΡΟΗ 1 · ΠΡΟΣΒΑΣΗ & ΕΓΚΡΙΣΗ')}
          </h3>
          <div className="panel mt16">
            <div className="flow">
              <div className="node">{t('Guest browses', 'Επισκέπτης')}</div>
              <span className="arw">→</span>
              <div className="node">{t('Sees specs, pricing hidden', 'Βλέπει προδιαγρ., τιμές κρυφές')}</div>
              <span className="arw">→</span>
              <div className="node blue">{t('Apply for access', 'Αίτηση πρόσβασης')}</div>
              <span className="arw">→</span>
              <div className="node">{t('Pending approval', 'Σε αναμονή')}</div>
              <span className="arw">→</span>
              <div className="node">{t('Admin approves / rejects', 'Admin εγκρίνει / απορρίπτει')}</div>
              <span className="arw">→</span>
              <div className="node">{t('Emailed outcome', 'Email αποτέλεσμα')}</div>
              <span className="arw">→</span>
              <div className="node blue">{t('Pricing unlocked', 'Τιμές ξεκλείδωσαν')}</div>
            </div>
          </div>

          <div className="grid g2 mt24">
            <div>
              <h3 className="head" style={{ letterSpacing: 1, color: 'var(--grey)', fontSize: 14 }}>
                {t('FLOW 2 · BUY (made-to-order)', 'ΡΟΗ 2 · ΑΓΟΡΑ (κατά παραγγελία)')}
              </h3>
              <div className="panel mt16">
                <div className="flow" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div className="node">{t('Product · Buy tab', 'Προϊόν · Αγορά')}</div>
                  <span className="arw">↓</span>
                  <div className="node">{t('See lead time + B2B price', 'Χρόνος + B2B τιμή')}</div>
                  <span className="arw">↓</span>
                  <div className="node">{t('Add to quote / cart', 'Προσθήκη σε προσφορά')}</div>
                  <span className="arw">↓</span>
                  <div className="node blue">
                    {t('Request quote OR pre-order + deposit', 'Αίτημα προσφοράς Ή προπαραγγελία')}
                  </div>
                  <span className="arw">↓</span>
                  <div className="node">{t('B2B invoice (VAT)', 'B2B τιμολόγιο (ΦΠΑ)')}</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="head" style={{ letterSpacing: 1, color: 'var(--grey)', fontSize: 14 }}>
                {t('FLOW 3 · RENT (date-based)', 'ΡΟΗ 3 · ΕΝΟΙΚΙΑΣΗ (βάσει ημ/νιών)')}
              </h3>
              <div className="panel mt16">
                <div className="flow" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div className="node">{t('Product · Rent tab', 'Προϊόν · Ενοικίαση')}</div>
                  <span className="arw">↓</span>
                  <div className="node">{t('Pick dates · availability check', 'Ημερομηνίες · έλεγχος')}</div>
                  <span className="arw">↓</span>
                  <div className="node">{t('Add delivery + setup', 'Παράδοση + εγκατάσταση')}</div>
                  <span className="arw">↓</span>
                  <div className="node blue">{t('Request booking', 'Αίτημα κράτησης')}</div>
                  <span className="arw">↓</span>
                  <div className="node">{t('Track in dashboard', 'Παρακολούθηση στο dashboard')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

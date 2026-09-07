import { Link } from 'react-router-dom'
import { useLang } from '../context/language'

/**
 * Privacy, browser-storage and terms pages.
 *
 * The factual parts describe what this application actually does — the exact
 * browser-storage keys, the fields each form collects, and the fact that it
 * contacts no third party at all — and were written from the code rather than
 * from a template.
 *
 * The parts marked NEEDS LEGAL REVIEW are the ones no engineer can supply:
 * the controller's registered identity, retention periods, lawful basis and
 * the commercial terms. They are deliberately left as visible placeholders so
 * the pages cannot be mistaken for reviewed policy.
 */

type Block = { heading?: string; body: string[]; list?: string[] }
type Doc = { title: string; intro: string; blocks: Block[] }

const PLACEHOLDER = '[NEEDS LEGAL REVIEW]'

function privacy(t: (en: string, el: string) => string): Doc {
  return {
    title: t('Privacy policy', 'Πολιτική απορρήτου'),
    intro: t(
      'What we collect when you use this site, why, and what you can ask us to do about it.',
      'Τι συλλέγουμε όταν χρησιμοποιείτε τον ιστότοπο, γιατί, και τι μπορείτε να ζητήσετε.',
    ),
    blocks: [
      {
        heading: t('Who is responsible', 'Υπεύθυνος επεξεργασίας'),
        body: [
          `${PLACEHOLDER} — ${t(
            'registered company name, address, company number and the email address for data requests.',
            'επωνυμία, έδρα, ΑΦΜ και email για αιτήματα δεδομένων.',
          )}`,
        ],
      },
      {
        heading: t('What we collect', 'Τι συλλέγουμε'),
        body: [
          t(
            'Only what the forms on this site ask for. Specifically:',
            'Μόνο ό,τι ζητούν οι φόρμες του ιστότοπου. Συγκεκριμένα:',
          ),
        ],
        list: [
          t(
            'Account: your name, email address, company name and VAT number. Your password is stored only as a hash and cannot be read back.',
            'Λογαριασμός: όνομα, email, εταιρεία και ΑΦΜ. Ο κωδικός αποθηκεύεται μόνο ως hash.',
          ),
          t(
            'Partner application: company, VAT number, contact name and role, email, phone, the categories you buy, and your message.',
            'Αίτηση συνεργάτη: εταιρεία, ΑΦΜ, επαφή και ρόλος, email, τηλέφωνο, κατηγορίες και μήνυμα.',
          ),
          t(
            'Quotes and orders: the items and quantities you request, your configuration notes, and the event date, type, venue and delivery address you give us.',
            'Προσφορές και παραγγελίες: είδη, ποσότητες, σημειώσεις διαμόρφωσης, ημερομηνία, τύπος, χώρος και διεύθυνση παράδοσης.',
          ),
          t(
            'Contact enquiries: your name, email, phone, event type and date, and your message.',
            'Αιτήματα επικοινωνίας: όνομα, email, τηλέφωνο, τύπος και ημερομηνία εκδήλωσης, μήνυμα.',
          ),
        ],
      },
      {
        heading: t('What we do not collect', 'Τι δεν συλλέγουμε'),
        body: [
          t(
            'No payment or card details are ever entered on this website. Nothing is charged online: our team confirms your requirements, sends a Scope of Work, and invoices for bank transfer. We run no advertising, analytics or tracking on this site.',
            'Δεν εισάγονται στοιχεία πληρωμής ή κάρτας στον ιστότοπο. Δεν γίνεται χρέωση online: η ομάδα μας επιβεβαιώνει, στέλνει Scope of Work και τιμολογεί για τραπεζικό έμβασμα. Δεν χρησιμοποιούμε διαφήμιση, analytics ή tracking.',
          ),
        ],
      },
      {
        heading: t('Why we hold it', 'Γιατί το διατηρούμε'),
        body: [
          t(
            'To answer your enquiry, to price and deliver the work you ask for, and to keep the records that come with a business sale.',
            'Για να απαντήσουμε, να κοστολογήσουμε και να παραδώσουμε το έργο, και για τα λογιστικά αρχεία της πώλησης.',
          ),
          `${PLACEHOLDER} — ${t(
            'the lawful basis relied on for each purpose, and how long each kind of record is kept.',
            'η νομική βάση για κάθε σκοπό και ο χρόνος διατήρησης κάθε αρχείου.',
          )}`,
        ],
      },
      {
        heading: t('Who else sees it', 'Ποιος άλλος το βλέπει'),
        body: [
          t(
            'Your enquiry and order details are emailed to our sales inbox so the team can follow up. Beyond that, nothing is shared with a third party: this site loads no external scripts, fonts or images, so browsing it does not reveal your visit to anyone else.',
            'Τα αιτήματα και οι παραγγελίες αποστέλλονται στο τμήμα πωλήσεων. Πέραν αυτού, τίποτε δεν κοινοποιείται σε τρίτους: ο ιστότοπος δεν φορτώνει εξωτερικά scripts, γραμματοσειρές ή εικόνες.',
          ),
          `${PLACEHOLDER} — ${t(
            'the email and hosting providers used, and where they process data.',
            'οι πάροχοι email και hosting και ο τόπος επεξεργασίας.',
          )}`,
        ],
      },
      {
        heading: t('Your rights', 'Τα δικαιώματά σας'),
        body: [
          t(
            'Under the GDPR you can ask us for a copy of the personal data we hold about you, ask us to correct it, ask us to delete it, object to how we use it, or ask for it in a portable form. You can also complain to the Hellenic Data Protection Authority.',
            'Βάσει GDPR μπορείτε να ζητήσετε αντίγραφο, διόρθωση, διαγραφή, εναντίωση ή φορητότητα των δεδομένων σας. Μπορείτε επίσης να προσφύγετε στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα.',
          ),
          `${PLACEHOLDER} — ${t(
            'the address to send a data request to, and the response time committed to.',
            'η διεύθυνση για αιτήματα δεδομένων και ο χρόνος απόκρισης.',
          )}`,
        ],
      },
    ],
  }
}

function storage(t: (en: string, el: string) => string): Doc {
  return {
    title: t('Cookies and browser storage', 'Cookies και αποθήκευση'),
    intro: t(
      'This site sets no cookies, runs no tracking and contacts no third party. It does keep a few things in your own browser so it can work.',
      'Ο ιστότοπος δεν χρησιμοποιεί cookies, tracking ούτε τρίτους. Κρατά μόνο μερικά στοιχεία στο πρόγραμμα περιήγησής σας.',
    ),
    blocks: [
      {
        heading: t('No cookies, no tracking', 'Χωρίς cookies, χωρίς tracking'),
        body: [
          t(
            'We set no cookies. There is no advertising, no analytics and no third-party tracking script anywhere on this site, so there is nothing here to consent to or opt out of.',
            'Δεν ορίζουμε cookies. Δεν υπάρχει διαφήμιση, analytics ή script παρακολούθησης, οπότε δεν υπάρχει κάτι για συγκατάθεση.',
          ),
        ],
      },
      {
        heading: t('What is kept in your browser', 'Τι κρατείται στο πρόγραμμα περιήγησης'),
        body: [
          t(
            'These are stored locally by your browser and never sent anywhere except back to this site. Clearing your browser data removes them.',
            'Αποθηκεύονται τοπικά και δεν αποστέλλονται πουθενά αλλού. Η εκκαθάριση δεδομένων τα αφαιρεί.',
          ),
        ],
        list: [
          t(
            'Sign-in token — keeps you signed in between visits. Removed when you log out.',
            'Token σύνδεσης — σας κρατά συνδεδεμένο. Αφαιρείται στην αποσύνδεση.',
          ),
          t(
            'Your account details — your name, company and approval status, so pages can render without waiting for the server.',
            'Στοιχεία λογαριασμού — όνομα, εταιρεία και κατάσταση έγκρισης.',
          ),
          t(
            'Language choice — whether you are reading English or Greek.',
            'Επιλογή γλώσσας — Αγγλικά ή Ελληνικά.',
          ),
          t(
            'Theme choice — whether the signed-in area is shown light or dark.',
            'Επιλογή θέματος — φωτεινό ή σκούρο.',
          ),
          t(
            'Your quote basket — the items you have added, so they survive a refresh.',
            'Το καλάθι προσφοράς — τα είδη που προσθέσατε.',
          ),
        ],
      },
      {
        heading: t('No third-party requests', 'Χωρίς αιτήματα σε τρίτους'),
        body: [
          t(
            'Everything this site needs is served from our own domain, including the typefaces. No external script, font or image is loaded, so visiting a page does not reveal your visit to anyone but us.',
            'Όλα εξυπηρετούνται από τον δικό μας domain, συμπεριλαμβανομένων των γραμματοσειρών. Δεν φορτώνεται εξωτερικό script, γραμματοσειρά ή εικόνα.',
          ),
        ],
      },
    ],
  }
}

function terms(t: (en: string, el: string) => string): Doc {
  return {
    title: t('Terms', 'Όροι'),
    intro: t(
      'How requests made through this site are handled.',
      'Πώς διαχειριζόμαστε τα αιτήματα μέσω του ιστότοπου.',
    ),
    blocks: [
      {
        heading: t('Nothing is sold on this website', 'Δεν γίνεται πώληση στον ιστότοπο'),
        body: [
          t(
            'Submitting a quote or order request through this site is a request, not a purchase, and it does not form a contract. No payment is taken online. Our team reviews what you have asked for, confirms the details, sends a Scope of Work, and invoices for payment by bank transfer.',
            'Η υποβολή αιτήματος δεν αποτελεί αγορά ούτε σύμβαση. Δεν γίνεται πληρωμή online. Η ομάδα μας ελέγχει, επιβεβαιώνει, στέλνει Scope of Work και τιμολογεί για πληρωμή με τραπεζικό έμβασμα.',
          ),
        ],
      },
      {
        heading: t('Prices shown', 'Τιμές'),
        body: [
          t(
            'Net prices are shown to approved business accounts only and exclude VAT, which is added on the invoice. Prices and any estimated subtotal shown while you build a request are indicative: the price that applies is the one on the quote our team sends you.',
            'Οι καθαρές τιμές εμφανίζονται μόνο σε εγκεκριμένους επιχειρηματικούς λογαριασμούς και δεν περιλαμβάνουν ΦΠΑ. Οι ενδεικτικές τιμές δεν δεσμεύουν: ισχύει η τιμή της προσφοράς που στέλνουμε.',
          ),
        ],
      },
      {
        heading: t('Business accounts', 'Επιχειρηματικοί λογαριασμοί'),
        body: [
          t(
            'Registration is reviewed before pricing and ordering are unlocked. We may decline or withdraw an account at our discretion.',
            'Η εγγραφή ελέγχεται πριν ξεκλειδώσουν τιμές και παραγγελίες. Μπορούμε να απορρίψουμε ή να ανακαλέσουμε λογαριασμό.',
          ),
        ],
      },
      {
        heading: t('The rest', 'Τα υπόλοιπα'),
        body: [
          `${PLACEHOLDER} — ${t(
            'payment terms and deposit, delivery and installation obligations, cancellation, hire conditions, warranty, limitation of liability, governing law and dispute resolution. These are commercial and legal commitments and must be drafted and reviewed by a qualified adviser before this page is published.',
            'όροι πληρωμής και προκαταβολής, παράδοση και εγκατάσταση, ακύρωση, όροι ενοικίασης, εγγύηση, περιορισμός ευθύνης, εφαρμοστέο δίκαιο και επίλυση διαφορών. Απαιτείται σύνταξη και έλεγχος από νομικό σύμβουλο.',
          )}`,
        ],
      },
    ],
  }
}

const DOCS = { privacy, storage, terms } as const

export default function Legal({ doc }: { doc: keyof typeof DOCS }) {
  const { t } = useLang()
  const content = DOCS[doc](t)

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Home / {content.title}</div>
          <div className="eyebrow">{t('Legal', 'Νομικά')}</div>
          <h1 className="h2 mt8">{content.title}</h1>
          <p className="muted mt8" style={{ maxWidth: '70ch' }}>
            {content.intro}
          </p>
        </div>
      </div>

      <section className="section-sm">
        <div className="container" style={{ maxWidth: '75ch' }}>
          {content.blocks.map((block, i) => (
            <div key={i} style={{ marginBottom: 30 }}>
              {block.heading && <h2 style={{ fontSize: 19, marginBottom: 10 }}>{block.heading}</h2>}
              {block.body.map((paragraph, j) => (
                <p
                  key={j}
                  className={paragraph.startsWith(PLACEHOLDER) ? undefined : 'muted'}
                  style={
                    paragraph.startsWith(PLACEHOLDER)
                      ? {
                          background: 'var(--warn-bg)',
                          border: '1px solid var(--line)',
                          borderRadius: 10,
                          padding: '12px 14px',
                          fontSize: 14,
                          marginBottom: 10,
                        }
                      : { fontSize: 15, marginBottom: 10 }
                  }
                >
                  {paragraph}
                </p>
              ))}
              {block.list && (
                <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                  {block.list.map((item, j) => (
                    <li key={j} className="muted" style={{ fontSize: 15, marginBottom: 7 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <p className="muted" style={{ fontSize: 13 }}>
            {t('Questions about any of this? ', 'Ερωτήσεις; ')}
            <Link to="/contact" style={{ color: 'var(--sky)' }}>
              {t('Get in touch', 'Επικοινωνήστε')}
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  )
}

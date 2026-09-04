import { useLang } from '../context/language'
import Eq from '../components/Eq'
import { Lock } from 'lucide-react'

const SWATCHES = [
  { name: 'Electric Blue', hex: '#1F8BFF', note: 'Primary · CTAs · AAA on #05070D' },
  { name: 'Sky Blue', hex: '#57C2FF', note: 'Accent · AAA' },
  { name: 'Deep Blue', hex: '#0A4FC4', note: 'Support' },
  { name: 'Charcoal', hex: '#121A28', note: 'Panels' },
  { name: 'Near-Black', hex: '#05070D', note: 'Background', border: true },
  { name: 'Platinum', hex: '#FFFFFF', note: 'Text · 19.2:1' },
]

export default function UIKit() {
  const { t } = useLang()
  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="eyebrow">SLS Design System</div>
          <h1 className="h2 mt8">
            {t('UI Kit — built from the SLS brandbook', 'UI Kit — βασισμένο στο SLS brandbook')}
          </h1>
          <p className="lead mt8">
            {t(
              'Dark theme · Electric-blue accents · Poppins + Inter · equalizer motif · WCAG AA.',
              'Σκούρο θέμα · Electric-blue · Poppins + Inter · μοτίβο equalizer · WCAG AA.',
            )}
          </p>
        </div>
      </div>

      <section className="section-sm">
        <div className="container">
          <h3 className="head" style={{ letterSpacing: 1, color: 'var(--grey)', fontSize: 14 }}>
            COLOUR PALETTE
          </h3>
          <div className="grid g4 mt16" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
            {SWATCHES.map((s) => (
              <div className="sw" key={s.name}>
                <div
                  className="c"
                  style={{
                    background: s.hex,
                    borderBottom: s.border ? '1px solid #20304a' : undefined,
                  }}
                />
                <div className="m">
                  <b>{s.name}</b>
                  <br />
                  {s.hex}
                  <br />
                  <span className="muted">{s.note}</span>
                </div>
              </div>
            ))}
          </div>

          <h3 className="head mt40" style={{ letterSpacing: 1, color: 'var(--grey)', fontSize: 14 }}>
            TYPOGRAPHY
          </h3>
          <div className="panel mt16">
            <div className="type-row">
              <div className="muted" style={{ fontSize: 12 }}>
                Poppins · Display / H1 · 64
              </div>
              <div className="h1">{t('Where your event comes to light', 'Εκεί που η εκδήλωση παίρνει φως')}</div>
            </div>
            <div className="type-row">
              <div className="muted" style={{ fontSize: 12 }}>
                Poppins · H2 · 42
              </div>
              <div className="h2">{t('Screens, lighting & sound', 'Οθόνες, φωτισμός & ήχος')}</div>
            </div>
            <div className="type-row">
              <div className="muted" style={{ fontSize: 12 }}>
                Poppins · Eyebrow · 12 · +3 tracking
              </div>
              <div className="eyebrow">{t('Our Services', 'Οι Υπηρεσίες μας')}</div>
            </div>
            <div className="type-row" style={{ border: 0 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Inter · Body · 16
              </div>
              <p style={{ maxWidth: '60ch' }}>
                {t(
                  'Clean, legible body copy for specs, proposals and web. Headlines in caps with generous letter-spacing per the SLS type system.',
                  'Καθαρό, ευανάγνωστο κείμενο για προδιαγραφές, προτάσεις και web. Τίτλοι με κεφαλαία και γενναιόδωρο letter-spacing.',
                )}
              </p>
            </div>
          </div>

          <div className="grid g2 mt40" style={{ alignItems: 'start' }}>
            <div>
              <h3 className="head" style={{ letterSpacing: 1, color: 'var(--grey)', fontSize: 14 }}>
                BUTTONS
              </h3>
              <div
                className="panel mt16"
                style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
              >
                <span className="btn btn-primary">Primary CTA</span>
                <span className="btn btn-ghost">Secondary</span>
                <span className="btn btn-primary btn-sm">Small</span>
                <span className="btn btn-ghost btn-sm">Small ghost</span>
              </div>
              <h3 className="head mt24" style={{ letterSpacing: 1, color: 'var(--grey)', fontSize: 14 }}>
                BADGES & STATUS
              </h3>
              <div
                className="panel mt16"
                style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}
              >
                <span className="status ok">Confirmed</span>
                <span className="status wait">Pending</span>
                <span className="status rej">Rejected</span>
                <span className="status blue">In production</span>
                <span className="chip on">Indoor</span>
                <span className="chip">Outdoor</span>
                <span className="price-locked">
                  <Lock size={13} aria-hidden /> Sign in for pricing
                </span>
              </div>
              <h3 className="head mt24" style={{ letterSpacing: 1, color: 'var(--grey)', fontSize: 14 }}>
                EQUALIZER MOTIF
              </h3>
              <div className="panel mt16">
                <Eq heights={[40, 70, 100, 60, 85, 45, 75, 55, 90, 35]} lg />
              </div>
            </div>
            <div>
              <h3 className="head" style={{ letterSpacing: 1, color: 'var(--grey)', fontSize: 14 }}>
                FORM FIELD
              </h3>
              <div className="panel mt16">
                <div className="field">
                  <label>Company name</label>
                  <input defaultValue="Nova Events Ltd" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>VAT number</label>
                  <input placeholder="EL123456789" />
                </div>
              </div>
              <h3 className="head mt24" style={{ letterSpacing: 1, color: 'var(--grey)', fontSize: 14 }}>
                PRODUCT CARD
              </h3>
              <div className="mt16" style={{ maxWidth: 280 }}>
                <div className="card">
                  <div className="thumb">
                    <img src="/assets/led-wall.jpg" alt="" />
                    <span className="tag">Indoor</span>
                  </div>
                  <div className="body">
                    <h3>Aurora P2.6</h3>
                    <ul className="specs">
                      <li>
                        <span>Pitch</span>
                        <b>2.6 mm</b>
                      </li>
                    </ul>
                    <div className="foot">
                      <span className="price-locked">
                        <Lock size={13} aria-hidden /> Pricing
                      </span>
                      <span className="btn btn-ghost btn-sm">View</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h3 className="head mt40" style={{ letterSpacing: 1, color: 'var(--grey)', fontSize: 14 }}>
            TOKENS (developer handoff)
          </h3>
          <div
            className="panel mt16"
            style={{ fontFamily: 'monospace', fontSize: 13, color: '#cdd8e6', lineHeight: 2 }}
          >
            --electric:#1F8BFF · --sky:#57C2FF · --deep:#0A4FC4 · --panel:#121A28 · --bg:#05070D ·
            --white:#FFFFFF · --grey:#9AA6B2
            <br />
            --radius:16px · --radius-lg:26px · --maxw:1240px · space:8/16/24/40/88 · breakpoints: 560 /
            900 / 1240
          </div>
        </div>
      </section>
    </>
  )
}

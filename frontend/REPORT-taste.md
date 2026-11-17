# SLS storefront — build report

**GATE: PASS** (round 3 of 3, `scripts/gate.mjs`, armed against `http://localhost:5173/`).

The plan, the deal, the voice card and the fact sheet are in [PLAN-taste.md](PLAN-taste.md).

---

## Waivers (4 of the 5 allowed)

| check | where | why |
|---|---|---|
| `no-visual` | `section#catalogue` | `sections.md` §1 lets a price list carry no picture, once a page. Its neighbours #screens and #rig both carry one. |
| `text-only` | `section#questions` | `sections.md` §1 lets an FAQ carry no picture, once a page, and the close that follows is its own picture (the big button). |
| `card-layout` | `section#screens` | Three photographs in three different compositions — bleed, split, pair — which `sections.md` Product rule 4 asks for. `.frame--photo` is a frame, not a card layout. |
| `one-heading` | `h2#pack-h` | 3.9% of scroll positions against a 3% bar; the second heading counted is the fixed nav's wordmark, which is on screen at every position. |

No open FAILs.

## Checks

| check | result |
|---|---|
| `gate.mjs` | **PASS** |
| `consistency.mjs` (1440, 1024, 820, 768, 390) | 0 FAIL outside the waivers, 18 WARN |
| `layout/check.mjs` (1440, 1024, 820, 768, 390) | no findings |
| `copy-lint.mjs` | 0 FAIL, 0 WARN (the 13 em dashes of the first draft are gone: the catalogue's figures line joins with a full stop and the lead times read as prose) |
| `perf.mjs` on the **built** page | 0 FAIL, 4 WARN — 407 KiB transferred, 20 requests, CSS 75 KiB, fonts 135 KiB, CLS 0.000, FCP 128 ms |
| `php artisan test` | 176 passed, 588 assertions |
| `tsc -b`, `oxlint` | clean |

`perf.mjs` against the **dev server** fails on JS weight (11 MB over 80 unbundled modules) and on
`api/products` 502s when the Laravel server is not running. Neither is real: the production build is
547 KB raw / 159 KB gzipped in one chunk.

### WARNs kept on purpose

- `copy-headings` on "Panels, fixtures and arrays" — the check wants a product name in the heading;
  the six product names are the rows directly under it.
- `section-gaps` at 820, 768 and 390 — the hero's photograph runs to the fold, so the gap from it
  to the next section is that section's top padding alone, where every other gap also carries the
  air under a section's content. Padding the hero out would break `hero-screen`.
- `scroll-reveal` on `#prices` — that is the dealt `word-highlight` moment, which is expected.
- `assets` — `api/products` 502 with no backend running.

---

## What the client has to supply

### Photographs — every picture on the site is a stand-in

SLS has no photographs of its own goods. The eleven files that were in `public/assets`
(`hero-stage.jpg`, `led-wall.jpg`, `tagline.jpg`, `catalogue.jpg`, `lighting.jpg`, `sound.jpg`,
`meet.jpg`, `one-partner.jpg`, `direct.jpg`, `made-order.jpg`, `hero-wide.jpg`) were AI-made
renders of blue stages — the same equaliser bars and the same light in every one, and the same
three of them reused across unrelated products. They are deleted.

In their place are seven licensed Wikimedia Commons photographs of **the same kinds of equipment**,
credited in one footer line. Each is a placeholder for a shot SLS must take:

| file | what it stands in for | the shot to take |
|---|---|---|
| `photo-f39317346-*` (Lumenbuddha, CC BY-SA 4.0) | moving heads rigged on truss in a warehouse | SLS's own stock on truss, prepped for a job |
| `photo-f167000710-*` (Junyu-K, CC BY 4.0) | the lamps of an LED panel at macro range | an Aurora P2.6 panel face at 2.6 mm, and a Titan P3.9 at 3.9 mm, same light |
| `photo-f7751364-*` (Ville Hyvönen, CC BY-SA 2.0) | a line array flown from truss | an LA-12 array flown at a real job |
| `photo-f2162506-*` (Scoreed, CC BY 2.5) | moving heads throwing beams | a Beam 380 rig lit, on a stage SLS built |
| `photo-f116189302-*` (Lchader, CC BY-SA 4.0) | a digital mixing console, lit | the desk at an SLS job, with an operator |
| `photo-f181466405-*`, `photo-f181466410-*` (VCCmatt, CC0) | foam-lined flight cases | SLS's own cases, loaded |

**The blocking shoot** is the six models on one backdrop, three angles each, plus a detail of each
part the pages name (the panel's lock, the clamp, the array's rigging). Until that exists the
catalogue is a list of figures rather than a line-up of pictures, and the three screen models share
one stand-in. One half-day with a photographer and one plain backdrop covers it.

Wikimedia holds nothing usable for a whole LED wall: almost every frame has readable branding or
content on the screen. Eleven candidates were fetched and looked at full size; seven were kept, four
rejected (a stadium facade with a club badge, a watermarked concert shot, a trade-show booth with
brand names, a distant stage build).

### Copy and facts

- **Nothing on the site is invented.** Every figure comes from `src/data/products.ts` or
  `backend/config/sls.php`. Where a fact did not exist, the line is not there.
- The **phone number** `+30 210 000 0000` is gone from /contact and from the application form's
  placeholders. It was a placeholder in a dialable format.
- The application form's placeholders — "Nova Events Ltd", "Maria Papadopoulou",
  "maria@novaevents.gr" — are gone. The labels say what each field is; the fields are empty.
- The catalogue's approved-state banner used to read **"Pricing unlocked — Nova Events Ltd (VAT
  EL123456789)"** to every approved partner, whoever they were. It is one line now, and it says
  only what is true of the person reading it.
- **`/projects` held six invented case studies** with invented figures (120 m², a 12k crowd, an
  800-guest launch) and invented client types. They are deleted. The route now redirects to
  `/ordering`, which describes a mechanism the code actually implements. Real case studies need the
  client's photographs, the client's permission and the real figures.
- **About** was the brand deck — four personality words, a mission sentence, a positioning
  statement and a table headed "Who we sell to" with customers sorted into Primary and Secondary
  tiers. It now says what SLS sells, who buys it and what SLS will not do.
- `hello@sls.gr`, `sales@sls.gr` and `partners@sls.gr` are the project's own addresses
  (`config/sls.php`), not `.example` stand-ins. The canonical domain still has to be confirmed.
- **Response-time promise:** "within one business day", once, on /contact. It was already the
  client's claim; it is now in one place and one wording.

### Still outstanding, from before this work

- `MAIL_MAILER` is still `log` on the servers: no email leaves the application.
- Render's `entrypoint.sh` still runs `migrate:fresh --seed --force` on every restart.
- `SLS_VAT_NUMBER` is unset, so the generated invoices are not valid Greek VAT invoices.
- `[NEEDS LEGAL REVIEW]` appears twice in the privacy policy.
- `VITE_SITE_URL` is unset, so the pre-rendered `og:image` and `canonical` stay relative.

---

## What changed, and why it no longer reads as machine-made

**The look.** The site was near-black with an electric-blue glow, two radial gradients fixed behind
every page, 16px rounded cards and Poppins — the default costume, worn by a company that sells
daylight-visible hardware. The first rebuild used a dealt palette (putty-black-teal); at the
client's request the palette is now SLS's own, put through `start.mjs brand`: the cool grey of the
old light theme as the ground, the logo's electric blue as the action colour, taken from `#1f8bff`
one step darker to `#1672e6` so a white label passes 4.6:1 (it holds 3.9:1 on the light ground and
4.4:1 on the near-black, so one button colour works on both), and the brand's near-black `#05070d`
with its sky blue `#57c2ff` brought back where the old site was strongest — the home page's first
screen, the dark band's one statement and the footer — not everywhere. The glow is gone; the type is
**IBM Plex Sans + IBM Plex Mono** (dealt).

**The structure.** Every page used to be the same skeleton: an eyebrow, an h2, three icon cards,
repeated three times. The home page had six eyebrow labels; it has none. It is eight screens, one
idea each, in six different compositions.

**The copy.** "Where your event comes to light", "Three capabilities, one partner", "Premium,
direct and accountable", "Premium / Precise / Energetic / Welcoming" — gone. The register is
technical-dry with proof, borrowing one move from refusal: the page sells on 2.6 mm, 1500 nits,
3840 Hz, 500 × 500 mm, 50% and 24%, and it says plainly what SLS will not do. 554 words on the home
page, 0 em dashes, 0 virtue words, one contrast frame, one list of three, one admission.

**The type.** IBM Plex is self-hosted with Greek and Greek-extended subsets, so a Greek heading
never falls back mid-sentence. 335 KB of Poppins and Inter went out; 336 KB of Plex came in. No
third-party request is made for type.

---

## How the kit is wired into the app

The taste-skill kit is in `public/kit`, loaded as plain files from `index.html`, exactly as the
skill asks. Three things had to be solved to put a static-page kit inside a router:

1. **`src/lib/kit.ts`** drives `system.js`, `layout.js` and `moments.js` by hand on every
   navigation, because each of them runs itself on `DOMContentLoaded` against markup that in a
   router arrives later and is replaced on every route. `system.js`'s `nav()` is not idempotent, so
   `Layout` remounts the header and the action bar per route and the second binding lands on a new
   node.
2. **`#root { display: contents }`** takes React's mount point out of the box tree, so the page is
   `header.nav`, a `main` of sections and `footer.closing` as children of `<body>` — which is what
   the kit's CSS (`main > section`, `body > nav.actionbar`) and its checker read.
3. **`src/sls-app.css`** is the old stylesheet, scoped under `.sls-app`, so the kit and the
   signed-in tooling never style the same element. `Layout` puts that wrapper on every route that
   is not part of the storefront. The tooling's own token names are mapped onto the dealt palette in
   `public/kit/sls-tokens.css`, so the dashboard and the admin followed the storefront without their
   markup being touched; `[data-theme='dark']` keeps the old near-black surfaces as the tooling's
   opt-in dark mode.

The dealt moments are `word-highlight` (the statement on the dark band) and `liquid-hover` (the
LED-pixel macro — the picture answers the pointer like the surface of a screen). One WebGL context,
mounted on view. No shader effect was added: the deal's `dark-band` already gives the page its one
contrasting ground, and the WebGL budget is spent on the dealt moment.

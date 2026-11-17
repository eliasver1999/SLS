# SLS storefront — taste-skill plan

Line 1 — **kind:** page type `product`, site-kind `tech`, kind `tech` (hardware: LED panels,
moving-head fixtures, line arrays). `<html data-type="product">`,
`<meta name="page-type" content="product">`, `<meta name="site-kind" content="tech">`.

Line 2 — **the deal** (dealt, not chosen):

| part | dealt | note |
|---|---|---|
| hero | `product` | `deal.mjs --type product --kind tech --has photo` |
| palette | **the client's own**, via `start.mjs brand`: bg #e8ecf2, ink #101a2b, action #1672e6 (the logo's #1f8bff darkened for a 4.5:1 white label), near-black #05070d with sky #57c2ff on the dark grounds (home hero, dark band, footer). Replaced the dealt `putty-black-teal` at the client's request. | Every piece of this trade's kit is matte black and every photograph of it is dark; on a warm stone ground the gear is the only dark thing on the page, which the near-black page it replaces could never do. |
| type | `plex` — IBM Plex Sans + IBM Plex Mono | first printed. The page sells on 2.6 mm, 1500 nits, 3840 Hz: Plex Mono sets those as tabular figures. |
| radius | `soft` | default for product/hardware |
| nav | `nav-split` | |
| footer | `footer-dark` | |
| close | `close-type` | |
| rhythm | `dark-band` | one `.ground-inverse` section, page middle or later |
| buttons | `pill` | `<html data-buttons="pill">` |
| mark | `initial` | |
| moments | `word-highlight` (statement), `liquid-hover` (photograph) | `moments.mjs pick --page tech --count 2` |

**Voice card** (never on the page):

```
Voice: technical-dry with proof (copy-registers.md 2), one move borrowed from 10 (refusal)
Pairs: exact, not cold; plain, not modest
Person: "you" for what the buyer gets, "SLS" for the work; the panel is the subject in feature lines
Sentences: mostly 8 to 16 words; one long one a section, where it explains
Humour: none
House words: panel, pitch, rig, lead time, trade account — the same word every time
Never: premium, brilliant, unforgettable, seamless, end-to-end, "one partner"
```

**Fact sheet** (everything from the repo; nothing invented)

| field | value | source |
|---|---|---|
| What it is | SLS builds LED walls, lighting rigs and PA systems to order for event companies and venues in Greece | `products.ts`, `sls.php` |
| For whom | event production companies, venues, retailers fitting a screen. Not consumers: prices need a trade account | `About.tsx`, `ProductController` |
| Instead today | re-quoting three suppliers, or importing direct and dealing with the factory | — (enemy) |
| True difference | no shelf stock; every panel cut to the room's size; price after approval; one order page carries the invoice | `OrderController`, `InvoiceIssuer` |
| Numbers | pitch 2.6 / 2.9 / 3.9 mm · 1500 nits · 3840 Hz · 500 × 500 mm panels · 2-year warranty · 3 to 4 weeks · 50 % deposit · VAT 24 % | `products.ts`, `sls.php` |
| People | none named | — (left out) |
| A limit | nothing ships from a shelf; prices are not published | the admission, once |
| The offer | apply → approved → prices → order → 50 % deposit invoiced | `Apply`, `OrderController` |
| Main action | **Apply for trade pricing** — same words in nav, hero, close, phone bar | |

**The plan in screens** (home; `--h` per section)

| # | id | one idea | picture (kind) | screens |
|---|---|---|---|---|
| 1 | hero | what SLS builds and for whom | f39317346 moving heads racked on truss, warehouse (**object, whole**) | 1 |
| 2 | product-statement | a panel is 500 × 500 mm and the pitch is what you buy | f167000710 LED pixels at macro, one dead (**parts**) — holds `liquid-hover` | 1 |
| 3 | range | the six models with their figures and lead time | none (specs table — the one picture-less section of its kind) | 1 |
| 4 | ordering | how an order runs, in verb-led steps | f7751364 line array flown on truss (**use**) | 1 |
| 5 | statement | the admission: nothing ships from a shelf | none (`word-highlight`'s own section, `.ground-inverse` = the dealt `dark-band`) | 1 |
| 6 | lights-sound | the other two ranges | f2162506 moving heads lit + f116189302 console (**use + parts**) | 1 |
| 7 | faq | five questions | none (FAQ) | 1 |
| 8 | footer.closing | `close-type` + `footer-dark` | the big button | 1 |

One object (the gear whole) leads the hero and no other section: 1 of the 3 allowed.
Picture-less sections 3, 5, 7 are never neighbours. No card layout twice.

**Stand-ins** — every photograph is a stand-in for a shot SLS must take. See REPORT-taste.md.

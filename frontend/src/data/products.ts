// Catalogue / product data, ported from the prototype's catalogue.html and
// product.html. Localised strings carry both languages; brand product names
// stay untranslated.

export type LS = { en: string; el: string }
export type Spec = { label: LS; value: LS }
// Rent has been removed for now — products are buy / quote only.
export type Mode = 'buy'
export type Category = 'screens' | 'lighting' | 'sound' | 'package'

export type Product = {
  slug: string
  name: string
  category: Category
  placementKey: 'indoor' | 'outdoor' | 'lighting' | 'sound' | 'package'
  /** Pixel pitch in mm; null for lighting and sound. */
  pitchMm?: number | null
  tag: LS
  image: string
  thumbs: string[]
  blurb: LS
  cardSpecs: Spec[]
  specTable: Spec[]
  modes: Mode[]
  /**
   * `price` (server-formatted) and `price_cents` are both omitted by the API
   * unless the caller is an approved partner.
   */
  buy?: { price?: string | null; price_cents?: number | null; unit: LS; leadTime: LS }
  featured?: boolean
}

const L = (en: string, el: string): LS => ({ en, el })

export const PRODUCTS: Product[] = [
  {
    slug: 'aurora-p26',
    name: 'Aurora P2.6',
    category: 'screens',
    placementKey: 'indoor',
    tag: L('Indoor', 'Εσωτ.'),
    image: '/assets/shots/photo-f167000710-960.jpg',
    thumbs: ['/assets/shots/photo-f167000710-960.jpg', '/assets/shots/photo-f181466405-960.jpg'],
    blurb: L(
      'Fine-pitch indoor video wall for stages, studios and premium retail — made to order to your exact size.',
      'Εσωτερική video wall λεπτού pitch για σκηνές, studios και premium retail — κατά παραγγελία στο ακριβές μέγεθός σας.',
    ),
    cardSpecs: [
      { label: L('Pitch', 'Pitch'), value: L('2.6 mm', '2.6 mm') },
      { label: L('Brightness', 'Φωτεινότ.'), value: L('1500 nits', '1500 nits') },
      { label: L('Lead time', 'Χρόνος'), value: L('3–4 wks', '3–4 εβδ.') },
    ],
    specTable: [
      { label: L('Pixel pitch', 'Pixel pitch'), value: L('2.6 mm', '2.6 mm') },
      { label: L('Brightness', 'Φωτεινότητα'), value: L('1500 nits', '1500 nits') },
      { label: L('Refresh rate', 'Refresh rate'), value: L('3840 Hz', '3840 Hz') },
      { label: L('Panel size', 'Μέγεθος panel'), value: L('500 × 500 mm', '500 × 500 mm') },
      { label: L('Placement', 'Τοποθέτηση'), value: L('Indoor', 'Εσωτερικό') },
      { label: L('Warranty', 'Εγγύηση'), value: L('2 years', '2 έτη') },
    ],
    modes: ['buy'],
    buy: {
      unit: L('/ panel · ex VAT', '/ panel · χωρίς ΦΠΑ'),
      leadTime: L('Made to order, 3 to 4 weeks', 'Κατά παραγγελία, 3 έως 4 εβδομάδες'),
    },
  },
  {
    slug: 'titan-p39',
    name: 'Titan P3.9',
    category: 'screens',
    placementKey: 'outdoor',
    tag: L('Outdoor', 'Εξωτ.'),
    image: '/assets/shots/photo-f167000710-960.jpg',
    thumbs: ['/assets/shots/photo-f167000710-960.jpg', '/assets/shots/photo-f39317346-960.jpg'],
    blurb: L(
      'High-brightness outdoor LED wall for festivals, stadiums and open-air stages — weatherproof and built to spec.',
      'Εξωτερική LED οθόνη υψηλής φωτεινότητας για φεστιβάλ, στάδια και υπαίθριες σκηνές — αδιάβροχη και κατά παραγγελία.',
    ),
    cardSpecs: [
      { label: L('Pitch', 'Pitch'), value: L('3.9 mm', '3.9 mm') },
      { label: L('Brightness', 'Φωτεινότ.'), value: L('5000 nits', '5000 nits') },
      { label: L('Lead time', 'Χρόνος'), value: L('4–5 wks', '4–5 εβδ.') },
    ],
    specTable: [
      { label: L('Pixel pitch', 'Pixel pitch'), value: L('3.9 mm', '3.9 mm') },
      { label: L('Brightness', 'Φωτεινότητα'), value: L('5000 nits', '5000 nits') },
      { label: L('Refresh rate', 'Refresh rate'), value: L('3840 Hz', '3840 Hz') },
      { label: L('IP rating', 'IP') , value: L('IP65', 'IP65') },
      { label: L('Placement', 'Τοποθέτηση'), value: L('Outdoor', 'Εξωτερικό') },
      { label: L('Warranty', 'Εγγύηση'), value: L('2 years', '2 έτη') },
    ],
    modes: ['buy'],
    buy: {
      unit: L('/ panel · ex VAT', '/ panel · χωρίς ΦΠΑ'),
      leadTime: L('Made to order, 4 to 5 weeks', 'Κατά παραγγελία, 4 έως 5 εβδομάδες'),
    },
  },
  {
    slug: 'flex-p29',
    name: 'Flex P2.9',
    category: 'screens',
    placementKey: 'indoor',
    tag: L('Indoor', 'Εσωτ.'),
    image: '/assets/shots/photo-f167000710-960.jpg',
    thumbs: ['/assets/shots/photo-f167000710-960.jpg', '/assets/shots/photo-f181466405-960.jpg'],
    blurb: L(
      'Curvable panel for creative stage builds — fast to rig and in stock for quick turnarounds.',
      'Καμπυλούμενο panel για δημιουργικές σκηνές — γρήγορο rigging και άμεσα διαθέσιμο.',
    ),
    cardSpecs: [
      { label: L('Pitch', 'Pitch'), value: L('2.9 mm', '2.9 mm') },
      { label: L('Curve', 'Καμπύλη'), value: L('±15°', '±15°') },
      { label: L('Lead time', 'Χρόνος'), value: L('In stock', 'Διαθέσιμο') },
    ],
    specTable: [
      { label: L('Pixel pitch', 'Pixel pitch'), value: L('2.9 mm', '2.9 mm') },
      { label: L('Curve', 'Καμπύλη'), value: L('±15°', '±15°') },
      { label: L('Panel size', 'Μέγεθος panel'), value: L('500 × 1000 mm', '500 × 1000 mm') },
      { label: L('Placement', 'Τοποθέτηση'), value: L('Indoor', 'Εσωτερικό') },
      { label: L('Availability', 'Διαθεσιμότητα'), value: L('In stock', 'Διαθέσιμο') },
    ],
    modes: ['buy'],
    buy: {
      unit: L('/ panel · ex VAT', '/ panel · χωρίς ΦΠΑ'),
      leadTime: L('In stock, ships in a week', 'Σε στοκ, αποστολή σε μία εβδομάδα'),
    },
  },
  {
    slug: 'beam-380',
    name: 'Beam 380',
    category: 'lighting',
    placementKey: 'lighting',
    tag: L('Lighting', 'Φωτισμός'),
    image: '/assets/shots/photo-f39317346-960.jpg',
    thumbs: ['/assets/shots/photo-f39317346-960.jpg', '/assets/shots/photo-f2162506-960.jpg'],
    blurb: L(
      'Moving-head beam fixture for concerts and events — punchy output, fast movement and full DMX control.',
      'Moving-head beam για συναυλίες και εκδηλώσεις — δυνατή έξοδος, γρήγορη κίνηση και πλήρης DMX έλεγχος.',
    ),
    cardSpecs: [
      { label: L('Type', 'Τύπος'), value: L('Moving head', 'Moving head') },
      { label: L('Output', 'Ισχύς'), value: L('380 W', '380 W') },
      { label: L('Control', 'Έλεγχος'), value: L('DMX', 'DMX') },
    ],
    specTable: [
      { label: L('Type', 'Τύπος'), value: L('Moving head beam', 'Moving head beam') },
      { label: L('Output', 'Ισχύς'), value: L('380 W', '380 W') },
      { label: L('Control', 'Έλεγχος'), value: L('DMX-512', 'DMX-512') },
      { label: L('Weight', 'Βάρος'), value: L('19 kg', '19 kg') },
      { label: L('Placement', 'Τοποθέτηση'), value: L('Stage / event', 'Σκηνή / εκδήλωση') },
    ],
    modes: ['buy'],
    buy: {
      unit: L('/ unit · ex VAT', '/ μονάδα · χωρίς ΦΠΑ'),
      leadTime: L('Made to order, 2 to 3 weeks', 'Κατά παραγγελία, 2 έως 3 εβδομάδες'),
    },
  },
  {
    slug: 'la-12-array',
    name: 'LA-12 Array',
    category: 'sound',
    placementKey: 'sound',
    tag: L('Sound', 'Ήχος'),
    image: '/assets/shots/photo-f7751364-960.jpg',
    thumbs: ['/assets/shots/photo-f7751364-960.jpg', '/assets/shots/photo-f116189302-960.jpg'],
    blurb: L(
      'Line-array system for live events and venues — even coverage and high SPL, tuned to the space.',
      'Σύστημα line-array για live events και χώρους — ομοιόμορφη κάλυψη και υψηλό SPL, ρυθμισμένο στον χώρο.',
    ),
    cardSpecs: [
      { label: L('Type', 'Τύπος'), value: L('Line-array', 'Line-array') },
      { label: L('SPL', 'SPL'), value: L('140 dB', '140 dB') },
      { label: L('Lead time', 'Χρόνος'), value: L('2–3 wks', '2–3 εβδ.') },
    ],
    specTable: [
      { label: L('Type', 'Τύπος'), value: L('Line-array', 'Line-array') },
      { label: L('Max SPL', 'Μέγιστο SPL'), value: L('140 dB', '140 dB') },
      { label: L('Drivers', 'Drivers'), value: L('2 × 12"', '2 × 12"') },
      { label: L('Amp', 'Ενισχυτής'), value: L('Bi-amped', 'Bi-amped') },
      { label: L('Placement', 'Τοποθέτηση'), value: L('Live / venue', 'Live / χώρος') },
    ],
    modes: ['buy'],
    buy: {
      unit: L('/ unit · ex VAT', '/ μονάδα · χωρίς ΦΠΑ'),
      leadTime: L('Made to order, 2 to 3 weeks', 'Κατά παραγγελία, 2 έως 3 εβδομάδες'),
    },
  },
  {
    slug: 'stage-kit-s',
    name: 'Stage Kit S',
    category: 'package',
    placementKey: 'package',
    tag: L('Package', 'Πακέτο'),
    image: '/assets/shots/photo-f2162506-960.jpg',
    thumbs: ['/assets/shots/photo-f2162506-960.jpg', '/assets/shots/photo-f116189302-960.jpg', '/assets/shots/photo-f39317346-960.jpg'],
    blurb: L(
      'A complete small-stage package — screen, lighting and sound supplied and set up as one accountable job.',
      'Ολοκληρωμένο πακέτο μικρής σκηνής — οθόνη, φωτισμός και ήχος με ενιαία παράδοση και εγκατάσταση.',
    ),
    cardSpecs: [
      { label: L('Screen', 'Οθόνη'), value: L('12 m²', '12 m²') },
      { label: L('Lights', 'Φώτα'), value: L('×8', '×8') },
      { label: L('Sound', 'Ήχος'), value: L('2 kW', '2 kW') },
    ],
    specTable: [
      { label: L('Screen', 'Οθόνη'), value: L('12 m² LED wall', '12 m² LED wall') },
      { label: L('Lights', 'Φώτα'), value: L('8 × moving head', '8 × moving head') },
      { label: L('Sound', 'Ήχος'), value: L('2 kW PA', '2 kW PA') },
      { label: L('Setup', 'Εγκατάσταση'), value: L('Delivery + operator', 'Παράδοση + χειριστής') },
    ],
    // Package price is scoped per event — quote only, no list price.
    modes: [],
  },
]

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug)
}

// Home featured order.
export const FEATURED = ['aurora-p26', 'titan-p39', 'beam-380', 'la-12-array']
  .map(getProduct)
  .filter(Boolean) as Product[]

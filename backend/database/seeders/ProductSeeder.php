<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->products() as $i => $p) {
            $p['sort'] = $i;
            Product::updateOrCreate(['slug' => $p['slug']], $p);
        }
    }

    /**
     * Localized-string helper.
     *
     * @return array{en:string, el:string}
     */
    private function ls(string $en, string $el): array
    {
        return ['en' => $en, 'el' => $el];
    }

    private function spec(string $le, string $ll, string $ve, string $vl): array
    {
        return ['label' => $this->ls($le, $ll), 'value' => $this->ls($ve, $vl)];
    }

    private function products(): array
    {
        return [
            [
                'slug' => 'aurora-p26',
                'name' => 'Aurora P2.6',
                'category' => 'screens',
                'placement_key' => 'indoor',
                'image' => '/assets/led-wall.jpg',
                'featured' => true,
                'tag' => $this->ls('Indoor', 'Εσωτ.'),
                'thumbs' => ['/assets/led-wall.jpg', '/assets/catalogue.jpg', '/assets/tagline.jpg', '/assets/meet.jpg'],
                'blurb' => $this->ls(
                    'Fine-pitch indoor video wall for stages, studios and premium retail — made to order to your exact size.',
                    'Εσωτερική video wall λεπτού pitch για σκηνές, studios και premium retail — κατά παραγγελία στο ακριβές μέγεθός σας.'
                ),
                'card_specs' => [
                    $this->spec('Pitch', 'Pitch', '2.6 mm', '2.6 mm'),
                    $this->spec('Brightness', 'Φωτεινότ.', '1500 nits', '1500 nits'),
                    $this->spec('Lead time', 'Χρόνος', '3–4 wks', '3–4 εβδ.'),
                ],
                'spec_table' => [
                    $this->spec('Pixel pitch', 'Pixel pitch', '2.6 mm', '2.6 mm'),
                    $this->spec('Brightness', 'Φωτεινότητα', '1500 nits', '1500 nits'),
                    $this->spec('Refresh rate', 'Refresh rate', '3840 Hz', '3840 Hz'),
                    $this->spec('Panel size', 'Μέγεθος panel', '500 × 500 mm', '500 × 500 mm'),
                    $this->spec('Placement', 'Τοποθέτηση', 'Indoor', 'Εσωτερικό'),
                    $this->spec('Warranty', 'Εγγύηση', '2 years', '2 έτη'),
                ],
                'modes' => ['buy'],
                'buy_price_cents' => 690000,
                'buy' => ['unit' => $this->ls('/ panel · ex VAT', '/ panel · χωρίς ΦΠΑ'), 'leadTime' => $this->ls('Made to order · lead time 3–4 weeks', 'Κατά παραγγελία · χρόνος παράδοσης 3–4 εβδομάδες')],
            ],
            [
                'slug' => 'titan-p39',
                'name' => 'Titan P3.9',
                'category' => 'screens',
                'placement_key' => 'outdoor',
                'image' => '/assets/tagline.jpg',
                'featured' => true,
                'tag' => $this->ls('Outdoor', 'Εξωτ.'),
                'thumbs' => ['/assets/tagline.jpg', '/assets/led-wall.jpg', '/assets/catalogue.jpg'],
                'blurb' => $this->ls(
                    'High-brightness outdoor LED wall for festivals, stadiums and open-air stages — weatherproof and built to spec.',
                    'Εξωτερική LED οθόνη υψηλής φωτεινότητας για φεστιβάλ, στάδια και υπαίθριες σκηνές — αδιάβροχη και κατά παραγγελία.'
                ),
                'card_specs' => [
                    $this->spec('Pitch', 'Pitch', '3.9 mm', '3.9 mm'),
                    $this->spec('Brightness', 'Φωτεινότ.', '5000 nits', '5000 nits'),
                    $this->spec('Lead time', 'Χρόνος', '4–5 wks', '4–5 εβδ.'),
                ],
                'spec_table' => [
                    $this->spec('Pixel pitch', 'Pixel pitch', '3.9 mm', '3.9 mm'),
                    $this->spec('Brightness', 'Φωτεινότητα', '5000 nits', '5000 nits'),
                    $this->spec('Refresh rate', 'Refresh rate', '3840 Hz', '3840 Hz'),
                    $this->spec('IP rating', 'IP', 'IP65', 'IP65'),
                    $this->spec('Placement', 'Τοποθέτηση', 'Outdoor', 'Εξωτερικό'),
                    $this->spec('Warranty', 'Εγγύηση', '2 years', '2 έτη'),
                ],
                'modes' => ['buy'],
                'buy_price_cents' => 840000,
                'buy' => ['unit' => $this->ls('/ panel · ex VAT', '/ panel · χωρίς ΦΠΑ'), 'leadTime' => $this->ls('Made to order · lead time 4–5 weeks', 'Κατά παραγγελία · χρόνος παράδοσης 4–5 εβδομάδες')],
            ],
            [
                'slug' => 'flex-p29',
                'name' => 'Flex P2.9',
                'category' => 'screens',
                'placement_key' => 'indoor',
                'image' => '/assets/catalogue.jpg',
                'featured' => false,
                'tag' => $this->ls('Indoor', 'Εσωτ.'),
                'thumbs' => ['/assets/catalogue.jpg', '/assets/led-wall.jpg'],
                'blurb' => $this->ls(
                    'Curvable panel for creative stage builds — fast to rig and in stock for quick turnarounds.',
                    'Καμπυλούμενο panel για δημιουργικές σκηνές — γρήγορο rigging και άμεσα διαθέσιμο.'
                ),
                'card_specs' => [
                    $this->spec('Pitch', 'Pitch', '2.9 mm', '2.9 mm'),
                    $this->spec('Curve', 'Καμπύλη', '±15°', '±15°'),
                    $this->spec('Lead time', 'Χρόνος', 'In stock', 'Διαθέσιμο'),
                ],
                'spec_table' => [
                    $this->spec('Pixel pitch', 'Pixel pitch', '2.9 mm', '2.9 mm'),
                    $this->spec('Curve', 'Καμπύλη', '±15°', '±15°'),
                    $this->spec('Panel size', 'Μέγεθος panel', '500 × 1000 mm', '500 × 1000 mm'),
                    $this->spec('Placement', 'Τοποθέτηση', 'Indoor', 'Εσωτερικό'),
                    $this->spec('Availability', 'Διαθεσιμότητα', 'In stock', 'Διαθέσιμο'),
                ],
                'modes' => ['buy'],
                'buy_price_cents' => 540000,
                'buy' => ['unit' => $this->ls('/ panel · ex VAT', '/ panel · χωρίς ΦΠΑ'), 'leadTime' => $this->ls('In stock · ships in 1 week', 'Διαθέσιμο · αποστολή σε 1 εβδομάδα')],
            ],
            [
                'slug' => 'beam-380',
                'name' => 'Beam 380',
                'category' => 'lighting',
                'placement_key' => 'lighting',
                'image' => '/assets/lighting.jpg',
                'featured' => true,
                'tag' => $this->ls('Lighting', 'Φωτισμός'),
                'thumbs' => ['/assets/lighting.jpg', '/assets/one-partner.jpg'],
                'blurb' => $this->ls(
                    'Moving-head beam fixture for concerts and events — punchy output, fast movement and full DMX control.',
                    'Moving-head beam για συναυλίες και εκδηλώσεις — δυνατή έξοδος, γρήγορη κίνηση και πλήρης DMX έλεγχος.'
                ),
                'card_specs' => [
                    $this->spec('Type', 'Τύπος', 'Moving head', 'Moving head'),
                    $this->spec('Output', 'Ισχύς', '380 W', '380 W'),
                    $this->spec('Control', 'Έλεγχος', 'DMX', 'DMX'),
                ],
                'spec_table' => [
                    $this->spec('Type', 'Τύπος', 'Moving head beam', 'Moving head beam'),
                    $this->spec('Output', 'Ισχύς', '380 W', '380 W'),
                    $this->spec('Control', 'Έλεγχος', 'DMX-512', 'DMX-512'),
                    $this->spec('Weight', 'Βάρος', '19 kg', '19 kg'),
                    $this->spec('Placement', 'Τοποθέτηση', 'Stage / event', 'Σκηνή / εκδήλωση'),
                ],
                'modes' => ['buy'],
                'buy_price_cents' => 190000,
                'buy' => ['unit' => $this->ls('/ unit · ex VAT', '/ μονάδα · χωρίς ΦΠΑ'), 'leadTime' => $this->ls('Made to order · lead time 2–3 weeks', 'Κατά παραγγελία · χρόνος παράδοσης 2–3 εβδομάδες')],
            ],
            [
                'slug' => 'la-12-array',
                'name' => 'LA-12 Array',
                'category' => 'sound',
                'placement_key' => 'sound',
                'image' => '/assets/sound.jpg',
                'featured' => true,
                'tag' => $this->ls('Sound', 'Ήχος'),
                'thumbs' => ['/assets/sound.jpg', '/assets/meet.jpg'],
                'blurb' => $this->ls(
                    'Line-array system for live events and venues — even coverage and high SPL, tuned to the space.',
                    'Σύστημα line-array για live events και χώρους — ομοιόμορφη κάλυψη και υψηλό SPL, ρυθμισμένο στον χώρο.'
                ),
                'card_specs' => [
                    $this->spec('Type', 'Τύπος', 'Line-array', 'Line-array'),
                    $this->spec('SPL', 'SPL', '140 dB', '140 dB'),
                    $this->spec('Lead time', 'Χρόνος', '2–3 wks', '2–3 εβδ.'),
                ],
                'spec_table' => [
                    $this->spec('Type', 'Τύπος', 'Line-array', 'Line-array'),
                    $this->spec('Max SPL', 'Μέγιστο SPL', '140 dB', '140 dB'),
                    $this->spec('Drivers', 'Drivers', '2 × 12"', '2 × 12"'),
                    $this->spec('Amp', 'Ενισχυτής', 'Bi-amped', 'Bi-amped'),
                    $this->spec('Placement', 'Τοποθέτηση', 'Live / venue', 'Live / χώρος'),
                ],
                'modes' => ['buy'],
                'buy_price_cents' => 320000,
                'buy' => ['unit' => $this->ls('/ unit · ex VAT', '/ μονάδα · χωρίς ΦΠΑ'), 'leadTime' => $this->ls('Made to order · lead time 2–3 weeks', 'Κατά παραγγελία · χρόνος παράδοσης 2–3 εβδομάδες')],
            ],
            [
                'slug' => 'stage-kit-s',
                'name' => 'Stage Kit S',
                'category' => 'package',
                'placement_key' => 'package',
                'image' => '/assets/one-partner.jpg',
                'featured' => false,
                'tag' => $this->ls('Package', 'Πακέτο'),
                'thumbs' => ['/assets/one-partner.jpg', '/assets/hero-stage.jpg'],
                'blurb' => $this->ls(
                    'A complete small-stage package — screen, lighting and sound supplied and set up as one accountable job.',
                    'Ολοκληρωμένο πακέτο μικρής σκηνής — οθόνη, φωτισμός και ήχος με ενιαία παράδοση και εγκατάσταση.'
                ),
                'card_specs' => [
                    $this->spec('Screen', 'Οθόνη', '12 m²', '12 m²'),
                    $this->spec('Lights', 'Φώτα', '×8', '×8'),
                    $this->spec('Sound', 'Ήχος', '2 kW', '2 kW'),
                ],
                'spec_table' => [
                    $this->spec('Screen', 'Οθόνη', '12 m² LED wall', '12 m² LED wall'),
                    $this->spec('Lights', 'Φώτα', '8 × moving head', '8 × moving head'),
                    $this->spec('Sound', 'Ήχος', '2 kW PA', '2 kW PA'),
                    $this->spec('Setup', 'Εγκατάσταση', 'Delivery + operator', 'Παράδοση + χειριστής'),
                ],
                // Package price is scoped per event — quote only, no list price.
                'modes' => [],
                'buy' => null,
            ],
        ];
    }
}

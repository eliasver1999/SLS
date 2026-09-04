<?php

namespace Database\Seeders;

use App\Models\Inquiry;
use Illuminate\Database\Seeder;

class InquirySeeder extends Seeder
{
    public function run(): void
    {
        $inquiries = [
            [
                'name' => 'Dimitris Kostas',
                'email' => 'dimitris@bigfest.gr',
                'phone' => '+30 210 123 4567',
                'event_type' => 'Festival main stage',
                'event_date' => now()->addMonths(3)->toDateString(),
                'message' => "We're producing a three-day festival and need a main-stage LED wall plus stage lighting. Roughly 60 m² of screen. Can you quote supply, delivery and on-site setup?",
                'status' => 'new',
            ],
            [
                'name' => 'Elena Varela',
                'email' => 'elena@corporate-athens.gr',
                'phone' => '+30 694 555 0110',
                'event_type' => 'Corporate conference',
                'event_date' => now()->addWeeks(6)->toDateString(),
                'message' => 'Two-day conference for 400 people — need screens for the main hall and sound for two breakout rooms.',
                'status' => 'handled',
            ],
        ];

        foreach ($inquiries as $inquiry) {
            Inquiry::create($inquiry);
        }
    }
}

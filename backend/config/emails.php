<?php

/*
|--------------------------------------------------------------------------
| Admin-editable transactional email events
|--------------------------------------------------------------------------
|
| Each entry defines one email an admin can edit from the admin panel. The
| registry is the contract between backend and editor UI: it declares which
| placeholders and structural blocks that event supports, plus the default
| copy (lifted from the original hardcoded Blade templates) an admin starts
| from. Placeholders are substituted by allowlist — admin copy is never
| evaluated as Blade or PHP.
|
| "blocks" are code-owned pieces of markup (tables, panels, buttons) the
| admin can switch on or off but not rewrite, so the mail layout stays
| intact and restyleable.
|
*/

$globals = ['sales_email', 'iban', 'bank_name', 'account_name', 'deposit_percent', 'balance_percent', 'vat_percent', 'app_url'];

$orderVars = ['reference', 'order_url', 'type', 'contact_name', 'company', 'vat_number', 'contact_email', 'notes',
    'subtotal', 'vat', 'total',
    'event_type', 'event_date', 'venue', 'delivery_address'];

$statusVars = [...$orderVars, 'status', 'status_label', 'previous_status', 'note'];

$statusDefaults = [
    'pending' => 'Your request is being reviewed by our team.',
    'quoted' => 'We’ve prepared your quote — our team will email the details and next steps.',
    'confirmed' => 'Your request is confirmed. Your Scope of Work and invoice appear on your order page as we issue them.',
    'in_production' => 'Good news — your order is now in production. We’ll let you know when it’s ready to dispatch.',
    'completed' => 'This request is complete — thank you for working with SLS. Your paperwork stays available on your order page.',
    'cancelled' => 'This request has been cancelled. If that’s unexpected, just reply and we’ll sort it out.',
];

$statusLabels = [
    'pending' => 'Pending',
    'quoted' => 'Quoted',
    'confirmed' => 'Confirmed',
    'in_production' => 'In production',
    'completed' => 'Completed',
    'cancelled' => 'Cancelled',
];

$statusEvents = [];

foreach ($statusDefaults as $status => $sentence) {
    $statusEvents["order.status.{$status}"] = [
        'label' => 'Order '.strtolower($statusLabels[$status]),
        'group' => 'Order progress',
        'description' => "Sent to the customer when an admin moves an order to “{$statusLabels[$status]}”.",
        'audience' => 'customer',
        'placeholders' => $statusVars,
        'blocks' => ['note_panel', 'total_line', 'bank_panel', 'event_details_table', 'order_button'],
        'default_subject' => 'SLS — {{ reference }} is now “{{ status_label }}”',
        'default_body' => "# Update on {{ reference }}\n\nHi {{ contact_name }}, the status of your {{ type }} is now **{{ status_label }}**.\n\n{$sentence}\n\nQuestions? Contact {{ sales_email }}.\n\nThanks,\nSound. Lights. Screens.",
        'default_blocks' => $status === 'cancelled'
            ? ['note_panel']
            : ['note_panel', 'total_line', 'order_button'],
    ];
}

return [

    // Structural blocks an admin can toggle, keyed by the identifier stored on
    // the template. "events" below declares which of these each email allows.
    'blocks' => [
        'items_table' => 'Order items table',
        'bank_panel' => 'Bank transfer / IBAN panel',
        'note_panel' => 'Note from the team (when an admin adds one)',
        'total_line' => 'Order total (ex VAT)',
        'signin_button' => '“Sign in to SLS” button',
        'admin_button' => '“Open admin” button',
        'order_details_table' => 'Order details table (internal)',
        'order_button' => '“View your order” button (paperwork lives there)',
        'enquiry_details_table' => 'Enquiry details table (internal)',
        'event_details_table' => 'Event details (date, venue, delivery)',
    ],

    'events' => [

        // ── Joining ────────────────────────────────────────────────
        'member.approved' => [
            'label' => 'Member approved',
            'group' => 'Joining',
            'description' => 'Sent to a member when an admin approves their registration.',
            'audience' => 'customer',
            'placeholders' => ['name', 'company', 'email', ...$globals],
            'blocks' => ['signin_button'],
            'default_subject' => 'SLS — your account is approved',
            'default_body' => "# You're approved, {{ name }} 🎉\n\nGood news — your SLS account has been approved.\n\nYou now have full **B2B access**: sign in to see net pricing, add items to a quote and submit order requests.\n\nAs always, no payment is taken on the website — our team confirms details and invoices by bank transfer (IBAN), with {{ vat_percent }}% VAT added on the invoice.\n\nQuestions? Just reply to this email or contact {{ sales_email }}.\n\nThanks,\nSound. Lights. Screens.",
            'default_blocks' => ['signin_button'],
        ],

        'member.rejected' => [
            'label' => 'Member rejected',
            'group' => 'Joining',
            'description' => 'Sent to a member when an admin rejects their registration.',
            'audience' => 'customer',
            'placeholders' => ['name', 'company', 'email', ...$globals],
            'blocks' => [],
            'default_subject' => 'SLS — about your registration',
            'default_body' => "# Hello {{ name }},\n\nThank you for your interest in an SLS B2B account. After review, we're not able to approve your registration at this time.\n\nIf you believe this was a mistake, or you'd like to share more about your business, just reply to this email or contact {{ sales_email }} and we'll be glad to take another look.\n\nThanks,\nSound. Lights. Screens.",
            'default_blocks' => [],
        ],

        // ── After an order is placed ───────────────────────────────
        'order.received.order' => [
            'label' => 'Order received',
            'group' => 'New order',
            'description' => 'Sent to the customer immediately after they submit an order request.',
            'audience' => 'customer',
            'placeholders' => [...$orderVars, ...$globals],
            'blocks' => ['event_details_table', 'items_table', 'bank_panel'],
            'default_subject' => 'SLS — order request received ({{ reference }})',
            'default_body' => "# Thanks, {{ contact_name }} 👋\n\nWe’ve received your **order request** ({{ reference }}) for **{{ company }}**.\nNo payment is taken on the website — everything is handled by our team, as set out below.\n\n## How payment works\n1. We email you a **Scope of Work (SOW)** confirming the details.\n2. A **{{ deposit_percent }}% deposit** confirms the order and starts production — pay by bank transfer (IBAN) to the account below.\n3. The remaining **{{ balance_percent }}%** is due **before dispatch**.\n\nAll prices are **ex VAT**; **{{ vat_percent }}% VAT** is added on the invoice.\n\nPlease **do not transfer any deposit yet** — wait for our SOW and invoice so the amount and reference are confirmed.\n\nA member of the SLS team will be in touch shortly. Questions? Just reply to this email or contact {{ sales_email }}.\n\nThanks,\nSound. Lights. Screens.",
            'default_blocks' => ['event_details_table', 'items_table', 'bank_panel'],
        ],

        'order.received.quote' => [
            'label' => 'Quote request received',
            'group' => 'New order',
            'description' => 'Sent to the customer immediately after they submit a quote request.',
            'audience' => 'customer',
            'placeholders' => [...$orderVars, ...$globals],
            'blocks' => ['event_details_table', 'items_table'],
            'default_subject' => 'SLS — quote request received ({{ reference }})',
            'default_body' => "# Thanks, {{ contact_name }} 👋\n\nWe’ve received your **quote request** ({{ reference }}) for **{{ company }}**.\nNo payment is taken on the website — everything is handled by our team.\n\n## What happens next\nOur team will prepare a formal quote and email it to you, usually **within one business day**. Once you approve it, we’ll send a Scope of Work and payment details.\n\nAll prices are **ex VAT**; **{{ vat_percent }}% VAT** is added on the invoice.\n\nQuestions? Just reply to this email or contact {{ sales_email }}.\n\nThanks,\nSound. Lights. Screens.",
            'default_blocks' => ['event_details_table', 'items_table'],
        ],

        'order.admin_notify' => [
            'label' => 'New order — internal notification',
            'group' => 'New order',
            'description' => 'Sent to the sales inbox so the team knows to follow up.',
            'audience' => 'sales',
            'placeholders' => [...$orderVars, ...$globals],
            'blocks' => ['order_details_table', 'event_details_table', 'items_table', 'admin_button'],
            'default_subject' => 'New {{ type }} — {{ reference }}',
            'default_body' => "# New {{ type }} — {{ reference }}\n\nA customer just submitted a **{{ type }}** request. Follow up to send the SOW / quote.\n\nSLS internal notification.",
            'default_blocks' => ['order_details_table', 'event_details_table', 'items_table', 'admin_button'],
        ],

        // ── Contact form ───────────────────────────────────────────
        'inquiry.received' => [
            'label' => 'Contact enquiry — internal notification',
            'group' => 'Contact form',
            'description' => 'Sent to the sales inbox when someone submits the contact form.',
            'audience' => 'sales',
            'placeholders' => ['name', 'email', 'phone', 'event_type', 'event_date', 'message', ...$globals],
            'blocks' => ['enquiry_details_table', 'admin_button'],
            'default_subject' => 'New enquiry — {{ event_type }} ({{ name }})',
            'default_body' => "# New enquiry\n\n**{{ name }}** submitted the contact form about a **{{ event_type }}**. Reply to {{ email }} to follow up.\n\nSLS internal notification.",
            'default_blocks' => ['enquiry_details_table', 'admin_button'],
        ],

        // ── Order progress (mid-order through delivery) ────────────
        ...$statusEvents,
    ],
];

<?php

// SLS business settings surfaced in transactional emails and order handling.
return [
    'sales_email' => env('SLS_SALES_EMAIL', 'sales@sls.gr'),
    // Your own VAT number and registered address. A Greek VAT invoice is
    // not valid without the issuer's VAT number, so the invoice template
    // omits the line entirely rather than printing an empty label — set
    // these before issuing anything a customer will file.
    'vat_number' => env('SLS_VAT_NUMBER'),
    'address' => env('SLS_ADDRESS', 'Athens, Greece'),
    'iban' => env('SLS_IBAN', 'GR16 0110 1250 0000 0001 2300 695'),
    'bank_name' => env('SLS_BANK_NAME', 'SLS Bank'),
    'account_name' => env('SLS_ACCOUNT_NAME', 'SLS Sound Lights Screens'),
    'deposit_percent' => (int) env('SLS_DEPOSIT_PERCENT', 50),
    'vat_percent' => (int) env('SLS_VAT_PERCENT', 24),
    'currency' => env('SLS_CURRENCY', 'EUR'),
];

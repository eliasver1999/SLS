<?php

// SLS business settings surfaced in transactional emails and order handling.
return [
    'sales_email' => env('SLS_SALES_EMAIL', 'sales@sls.gr'),
    'iban' => env('SLS_IBAN', 'GR16 0110 1250 0000 0001 2300 695'),
    'bank_name' => env('SLS_BANK_NAME', 'SLS Bank'),
    'account_name' => env('SLS_ACCOUNT_NAME', 'SLS Sound Lights Screens'),
    'deposit_percent' => (int) env('SLS_DEPOSIT_PERCENT', 50),
    'vat_percent' => (int) env('SLS_VAT_PERCENT', 24),
];

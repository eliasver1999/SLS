<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartnerApplication extends Model
{
    protected $fillable = [
        'reference', 'company', 'vat', 'contact_name', 'role',
        'email', 'phone', 'buys', 'message', 'status',
    ];

    protected $casts = [
        'buys' => 'array',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $fillable = ['event', 'subject', 'body', 'blocks', 'enabled'];

    protected $casts = [
        'blocks' => 'array',
        'enabled' => 'boolean',
    ];
}

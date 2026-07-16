<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'slug', 'name', 'category', 'placement_key', 'image',
        'tag', 'blurb', 'thumbs', 'card_specs', 'spec_table',
        'modes', 'buy', 'featured', 'sort',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected $casts = [
        'tag' => 'array',
        'blurb' => 'array',
        'thumbs' => 'array',
        'card_specs' => 'array',
        'spec_table' => 'array',
        'modes' => 'array',
        'buy' => 'array',
        'featured' => 'boolean',
    ];
}

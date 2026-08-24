<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class HeroBanner extends Model
{
    use HasFactory;
protected $appends = ['image_url'];
    protected $fillable = [
        'title',
        'subtitle',
        'button_text',
        'button_link',
        'image_path',
        'is_active',
    ];


    public function getImageUrlAttribute()
{
    if (!$this->image_path) {
        return null;
    }

    // Remove 'public/' prefix if present
    $cleanPath = preg_replace('#^public/#', '', $this->image_path);

    // Return full URL to storage file
    return Storage::disk('r2')->url($cleanPath);
}
}

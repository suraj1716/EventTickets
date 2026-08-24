<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CategoryGroup extends Model
{
    use HasFactory;

    protected $appends = ['image_url'];
    protected $fillable = ['name', 'image', 'active'];

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'category_group_category');
    }
    public function getImageUrlAttribute()
{
    return $this->image ? Storage::disk('r2')->url($this->image) : null;
}

// public function getRouteKeyName()
// {
//     return 'slug';
// }
}

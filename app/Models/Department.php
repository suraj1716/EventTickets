<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;


class Department extends Model
{
protected $appends = ['image_url'];
    protected $fillable = [
        'name',
        'slug',
        'meta_title',
        'meta_description',
        'image',  // add this
        // other fields...
    ];

public function getImageUrlAttribute()
{
    return $this->image ? Storage::disk('r2')->url($this->image) : null;
}

    public function  categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }


    public function scopePublished(Builder $query): Builder
    {
        return $query->where('active', true);
    }


    public function scopeWithProducts($query)
    {
        return $query->whereHas('categories.products')
            ->with(['categories' => function ($q) {
                $q->whereHas('products');
            }]);
    }

    // In Department.php
    public function products()
    {
        return $this->hasManyThrough(
            Product::class,
            Category::class,
            'department_id', // Foreign key on categories table
            'category_id',   // Foreign key on products table
            'id',           // Local key on departments table
            'id'            // Local key on categories table
        );
    }
}

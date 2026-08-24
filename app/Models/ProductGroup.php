<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;



class ProductGroup extends Model
{
    protected $fillable = ['name', 'slug', 'images', 'active'];
     public $products;
     protected $casts = [
    'images' => 'array',
];


protected $appends = ['image_url', 'images_urls'];

public function getImagesUrlsAttribute()
{
    return collect($this->images ?? [])->map(fn($img) => Storage::disk('r2')->url($img))->toArray();
}

  public function products()
{
    return $this->belongsToMany(Product::class, 'product_group_product');
}
public function groupedProducts()
{
    return $this->belongsToMany(Product::class, 'product_group_product');
}
 public function getImageUrlAttribute()
    {
        if (!$this->image) {
            return null; // or a placeholder URL
        }
        return \Storage::disk('r2')->url($this->image);
    }

    public function getRouteKeyName()
{
    return 'slug';
}

}

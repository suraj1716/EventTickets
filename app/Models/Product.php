<?php

namespace App\Models;

use App\Enums\ProductStatusEnum;
use App\Enums\VendorStatusEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Facades\Auth;
use Spatie\Image\Manipulations;
use Spatie\MediaLibrary\Conversions\Manipulations as ConversionsManipulations;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Collections\MediaCollection;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Product extends Model implements HasMedia
{
    use HasFactory;
    use InteractsWithMedia;
    protected $casts = [
        'deleted_combinations' => 'array',
        'price' => 'float',
    ];
    // protected $casts = [
    //     'variations' => 'array'
    // ];

    public function scopeForVendorOrPublished(Builder $query): Builder
    {
        $userId = Auth::id();

        return $query->where(function ($q) use ($userId) {
            $q->where('created_by', $userId)
                ->orWhere('status', ['published', 'draft']);
        });
    }



    public function ScopeForVendor(Builder $query): Builder
    {
        $userId = Auth::id();

        return $query->where('created_by', $userId)
            ->orWhere('status', 'published');
    }

    public function ScopePublished(Builder $query): Builder
    {
        return $query->where('products.status', ProductStatusEnum::Published);
    }


    public function ScopeForWebsite(Builder $query): Builder
    {
        return $query->published()->VendorApproved();
    }


    // public function scopeVendorApproved(Builder $query)
    // {
    //     return $query->join('vendors', 'vendors.user_id', '=', 'products.created_by')
    //         ->where('vendors.status', VendorStatusEnum::Approved->value);
    // }
    public function scopeVendorApproved($query)
    {
        return $query->whereHas('vendor', function ($q) {
            $q->where('status', 'approved');
        });
    }


    // In Product.php model
    public function scopeSearchKeyword($query, $keyword)
    {
        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'LIKE', "%{$keyword}%")
                    ->orWhere('description', 'LIKE', "%{$keyword}%");
            });
        }

        return $query;
    }



    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('images')
            ->useDisk('r2');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(100)
            ->quality(80)
            ->nonQueued()
            ->performOnCollections('images');

        $this->addMediaConversion('small')
            ->width(480)
            ->quality(80)
            ->performOnCollections('images');

        $this->addMediaConversion('large')
            ->width(1200)
            ->height(800)
            ->optimize()
            ->quality(75)
            ->performOnCollections('images');
    }


    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }


    public function department(): BelongsTo
    {

        return $this->belongsTo(Department::class, 'department_id');
    }
    public function category(): BelongsTo
    {

        return $this->belongsTo(Category::class);
    }


    public function variationTypes()
    {
        return $this->hasMany(VariationType::class);
        // ->with('options')->orderBy('sort');
    }



    public function variations()
    {

        return $this->hasMany(ProductVariation::class, 'product_id');
    }



    public function options(): HasManyThrough
    {
        return $this->hasManyThrough(
            VariationTypeOption::class,
            VariationType::class,
            'product_id',
            'variation_type_id',
            'id',
            'id'
        );
    }


    public function getPriceForFirstOptions(): float
    {
        $firstOptions = $this->getFirstOptionsMap();
        if ($firstOptions) {
            return $this->getPriceForOptions($firstOptions);
        }
        return $this->price;
    }

    public function getPriceForOptions($optionIds = [])
    {
        $optionIds = array_values((array) $optionIds);
        sort($optionIds);

        foreach ($this->variations as $variation) {
            $raw = $variation->getRawOriginal('variation_type_option_ids');

            // Fix: handle null, empty string, and invalid JSON
            if (empty($raw)) continue;

            $a = is_array($raw) ? $raw : json_decode($raw, true);

            // Fix: skip if still not an array after decode
            if (!is_array($a)) continue;

            sort($a);

            if ($a === $optionIds) {
                return $variation->price !== null ? $variation->price : $this->price;
            }
        }

        return $this->price;
    }


    public function getImages(): MediaCollection
    {
        if ($this->options->count()) {
            foreach ($this->options as $opt) {
                $images = $opt->getMedia('images');
                if ($images->isNotEmpty()) {  // <-- check for non-empty collection
                    return $images;
                }
            }
        }
        return $this->getMedia('images');
    }


    public function getFirstOptionsMap(): array
    {

        return $this->variationTypes
            ->mapWithKeys(fn($type) => [$type->id => $type->options[0]?->id])
            ->toArray();
    }

    public function getImageForOptions(array $optionIds = null)
    {
        if ($optionIds) {
            $optionIds = array_values($optionIds);
            sort($optionIds);
            $options = VariationTypeOption::whereIn('id', $optionIds)->get();

            foreach ($options as $option) {
                $image = $option->getFirstMediaUrl('images', 'small');
                if ($image) {
                    return $image;
                }
            }
        }

        return $this->getFirstMediaUrl('images', 'small');
    }


    public function getFirstImageUrl($collectionName = 'images', $conversion = 'small'): string
    {
        if ($this->options && $this->options->count() > 0) {
            foreach ($this->options as $opt) {
                $imageUrl = $opt->getFirstMediaUrl($collectionName, $conversion);
                if (!empty($imageUrl)) {
                    return $imageUrl;
                }
            }
        }

        return $this->getFirstMediaUrl($collectionName, $conversion);
    }




    public function scopeFilterApproved($query, $departmentIds = null, $categoryIds = null, $price = null)
    {
        if (is_array($departmentIds) && count($departmentIds) > 0) {
            $query->whereHas('category', function ($q) use ($departmentIds) {
                $q->whereIn('department_id', $departmentIds);
            });
        } elseif ($departmentIds && $departmentIds != 0) {
            $query->whereHas('category', function ($q) use ($departmentIds) {
                $q->where('department_id', $departmentIds);
            });
        }

        if (is_array($categoryIds) && count($categoryIds) > 0) {
            $query->whereIn('category_id', $categoryIds);
        } elseif ($categoryIds && $categoryIds != 0) {
            $query->where('category_id', $categoryIds);
        }

        if ($price) {
            $query->where('price', '<=', $price);
        }

        return $query->where('status', 'published')
            ->whereHas('vendor', function ($q) {
                $q->where('status', 'approved');
            });
    }


    public function vendor()
    {
        return $this->belongsTo(Vendor::class, 'created_by', 'user_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }


    public function productGroups()
    {
        return $this->belongsToMany(ProductGroup::class, 'product_group_product'); // Explicit pivot table name
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use App\Models\Event;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
class Category extends Model
{
    protected $appends = ['image_url'];
    protected $fillable = [
        'name',
        'description',
        'parent_id',
        'department_id',
        'active',
        'image',
        'slug',
        'created_by', // add this
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }
public function events(): BelongsToMany
{
    return $this->belongsToMany(Event::class);
}
    public function getImageUrlAttribute()
    {
        return $this->image ? Storage::disk('r2')->url($this->image) : null;
    }

    public function categoryGroups()
    {
        return $this->belongsToMany(CategoryGroup::class, 'category_group_category');
    }
}

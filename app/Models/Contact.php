<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
   protected $fillable = [
    'name',
    'email',
    'phone',
    'message',
    'reason',
    'department_id',
    'category_id',
    'product_id',
    'quantity',
    'file_path',
    'is_read'
];


public function department()
{
    return $this->belongsTo(Department::class);
}

public function category()
{
    return $this->belongsTo(Category::class);
}

public function product()
{
    return $this->belongsTo(Product::class);
}


}


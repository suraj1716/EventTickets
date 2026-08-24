<?php



namespace App\Models;
use Illuminate\Support\Collection;
use App\Models\VariationTypeOption;
use Illuminate\Database\Eloquent\Model;
use Livewire\Attributes\Modelable;

class ProductVariation extends Model
{
    protected $table = 'product_variations';
    public Product $product;
    protected $fillable = ['variation_type_option_ids', 'quantity', 'price','product_id',];

    // Cast the 'variation_type_option_ids' attribute to an array
    protected $casts = [
        'variation_type_option_ids' => 'array',
    ];

     public function product()
    {
        return $this->belongsTo(Product::class);
    }

}
















// namespace App\Models;

// use Illuminate\Database\Eloquent\Model;

// class ProductVariation extends Model
// {
//     protected $casts=[
//         'variation_type_option_ids'=>'json',
//     ];



// }




<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariation;
use Illuminate\Database\Seeder;

class ProductVariationSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Product::whereIn('slug', ['festival-essentials-pack', 'concert-ear-protection-kit'])->get() as $product) {
            $type = $product->variationTypes()->first();
            if (! $type) {
                continue;
            }

            foreach ($type->options as $option) {
                ProductVariation::updateOrCreate(
                    ['product_id' => $product->id, 'variation_type_option_ids' => json_encode([$option->id])],
                    [
                        'quantity' => $product->quantity,
                        'price' => (float) $product->price + (float) $option->price_modifier,
                    ]
                );
            }
        }
    }
}

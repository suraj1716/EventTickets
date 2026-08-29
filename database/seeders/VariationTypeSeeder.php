<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\VariationType;
use App\Models\VariationTypeOption;
use Illuminate\Database\Seeder;

class VariationTypeSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Product::whereIn('slug', ['festival-essentials-pack', 'concert-ear-protection-kit'])->get() as $product) {
            $type = VariationType::updateOrCreate(
                ['product_id' => $product->id, 'name' => 'Pack Size'],
                ['sort' => 1, 'type' => 'select']
            );

            foreach ([
                ['name' => 'Standard', 'price_modifier' => 0],
                ['name' => 'Premium', 'price_modifier' => 10],
            ] as $sort => $option) {
                VariationTypeOption::updateOrCreate(
                    ['variation_type_id' => $type->id, 'name' => $option['name']],
                    ['sort' => $sort + 1, 'price_modifier' => $option['price_modifier']]
                );
            }
        }
    }
}

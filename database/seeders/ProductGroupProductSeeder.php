<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductGroup;
use Illuminate\Database\Seeder;

class ProductGroupProductSeeder extends Seeder
{
    public function run(): void
    {
        ProductGroup::where('slug', 'festival-favourites')->firstOrFail()
            ->products()->sync(
                Product::whereIn('slug', ['festival-essentials-pack', 'concert-ear-protection-kit'])->pluck('id')->all()
            );

        ProductGroup::where('slug', 'event-day-essentials')->firstOrFail()
            ->products()->sync(
                Product::whereIn('slug', ['concert-ear-protection-kit', 'event-lanyard-badge-set', 'workshop-materials-pack'])->pluck('id')->all()
            );
    }
}

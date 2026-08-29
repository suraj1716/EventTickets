<?php

namespace Database\Seeders;

use App\Models\ProductGroup;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductGroupSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Festival Favourites', 'Event Day Essentials'] as $name) {
            ProductGroup::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'active' => true, 'images' => []]
            );
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\CategoryGroup;
use Illuminate\Database\Seeder;

class CategoryGroupSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Popular Events', 'Experiences', 'Sports & Live Shows'] as $name) {
            CategoryGroup::updateOrCreate(
                ['name' => $name],
                ['active' => true, 'image' => null]
            );
        }
    }
}

<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Category;
use App\Models\User;
use App\Models\Department;

class ProductFactory extends Factory
{
    protected $model = \App\Models\Product::class;

    public function definition()
    {
        return [
            'title' => $title = $this->faker->sentence(3),
            'slug' => Str::slug($title),
            'description' => '<p>' . $this->faker->paragraph() . '</p>',
            'department_id' => 1,  // Use valid existing IDs here
            'category_id' => 1,    // Use valid existing IDs here
            'price' => $this->faker->randomFloat(2, 10, 1000),
            'status' => 'published',
            'quantity' => $this->faker->numberBetween(1, 100),
            'created_by' => 1,     // Use existing user IDs
            'updated_by' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}

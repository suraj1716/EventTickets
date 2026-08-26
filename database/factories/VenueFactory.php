<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Venue;
use Illuminate\Database\Eloquent\Factories\Factory;

class VenueFactory extends Factory
{
    protected $model = Venue::class;

    public function definition(): array
    {
        return [
            'created_by_user_id' => User::factory(),
            'name' => fake()->company() . ' Venue',
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'state' => fake()->state(),
            'postcode' => fake()->postcode(),
            'country' => 'Australia',
            'latitude' => fake()->latitude(-43, -10),
            'longitude' => fake()->longitude(113, 154),
            'capacity' => fake()->numberBetween(50, 1000),
            'seating_type' => 'general',
            'contact_name' => fake()->name(),
            'contact_email' => fake()->safeEmail(),
            'contact_phone' => fake()->phoneNumber(),
            'notes' => null,
            'image_url' => null,
            'is_active' => true,
        ];
    }
}

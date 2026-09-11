<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        return [
            'vendor_user_id' => User::factory(),
            'name' => fake()->unique()->sentence(3),
            'type' => 'standalone',
            'description' => fake()->paragraph(),
            'status' => 'published',
            'languages' => ['English'],
            'watchlist_enabled' => false,
            'published_at' => now(),
        ];
    }

    public function proposed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'proposed',
            'watchlist_enabled' => true,
            'published_at' => null,
        ]);
    }

    public function tour(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'tour',
        ]);
    }
}

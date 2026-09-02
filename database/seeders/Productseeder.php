<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Event;
use App\Models\Product;
use App\Models\VariationType;
use App\Models\VariationTypeOption;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $eventSlug = config('seeders.merch_event_slug', env('MERCH_EVENT_SLUG'));

        if (! $eventSlug) {
            $this->command->warn('MERCH_EVENT_SLUG is not set — skipping ProductSeeder.');
            return;
        }

        $event = Event::with('categories')->where('slug', $eventSlug)->first();

        if (! $event) {
            $this->command->warn("Event not found (slug: {$eventSlug}) — skipping ProductSeeder.");
            return;
        }

        $vendorUserId = $event->vendor_user_id;

        if (! $vendorUserId) {
            $this->command->warn("Event '{$eventSlug}' has no vendor_user_id — skipping ProductSeeder.");
            return;
        }

        $eventCategory = $event->categories->first();

        if (! $eventCategory) {
            $this->command->warn("Event '{$eventSlug}' has no category attached — skipping ProductSeeder.");
            return;
        }

        $dept = Department::find($eventCategory->department_id);

        if (! $dept) {
            $this->command->warn("Department not found for event '{$eventSlug}'s category — skipping ProductSeeder.");
            return;
        }

        $products = [
            [
                'title' => 'Event T-Shirt',
                'price' => 30.00,
                'highlight' => 'trending',
                'variations' => [
                    [
                        'name' => 'Size',
                        'type' => 'radio',
                        'options' => [
                            ['name' => 'S', 'price_modifier' => 0],
                            ['name' => 'M', 'price_modifier' => 0],
                            ['name' => 'L', 'price_modifier' => 0],
                            ['name' => 'XL', 'price_modifier' => 3],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'Snapback Cap',
                'price' => 28.00,
                'highlight' => 'new',
            ],
            [
                'title' => 'Event Poster',
                'price' => 18.00,
                'highlight' => null,
            ],
            [
                'title' => 'Tote Bag',
                'price' => 20.00,
                'highlight' => null,
            ],
            [
                'title' => 'Enamel Mug',
                'price' => 15.00,
                'highlight' => null,
            ],
        ];

        foreach ($products as $data) {
            try {
                $this->seedProduct(
                    $data,
                    $event,
                    $dept,
                    $eventCategory,
                    $vendorUserId
                );
            } catch (Throwable $e) {
                $this->command->warn(
                    "Failed to seed '{$data['title']}': {$e->getMessage()} — continuing with the rest."
                );
            }
        }
    }

    private function seedProduct(
        array $data,
        Event $event,
        Department $dept,
        $eventCategory,
        int $vendorUserId
    ): void {
        $slug = Str::slug($data['title']);

        $product = Product::updateOrCreate(
            ['slug' => $slug],
            [
                'title' => $data['title'],
                'description' => $data['title'] . ' — official event merchandise.',
                'price' => $data['price'],
                'category_id' => $eventCategory->id,
                'event_id' => $event->id,
                'department_id' => $dept->id,
                'status' => 'published',
                'highlight' => $data['highlight'],
                'product_type' => 'product',
                'require_additional_file' => false,
                'created_by' => $vendorUserId,
                'updated_by' => $vendorUserId,
            ]
        );
       if ($product->wasRecentlyCreated || $product->getMedia('images')->isEmpty()) {
    $imagePath = $this->resolveImage($data['title']);

    if ($imagePath && is_file($imagePath)) {
        try {
            $product->clearMediaCollection('images');

            $product
                ->addMedia($imagePath)
                ->preservingOriginal()
                ->toMediaCollection('images');

            $this->command->info(
                "Image added for '{$data['title']}'"
            );

        } catch (Throwable $e) {
            $this->command->warn(
                "addMedia failed for '{$data['title']}': {$e->getMessage()}"
            );
        }
    } else {
        $this->command->warn(
            "No image available for '{$data['title']}'"
        );
    }
}

        if ($product->variationTypes()->exists()) {
            return;
        }

        $variations = $data['variations'] ?? [];

        if (empty($variations)) {
            return;
        }

        $typeOptionIds = [];

        foreach ($variations as $sort => $varData) {
            $variationType = VariationType::create([
                'product_id' => $product->id,
                'name' => $varData['name'],
                'type' => $varData['type'],
                'sort' => $sort,
            ]);

            $optionIds = [];

            foreach ($varData['options'] as $optSort => $optData) {
                $option = VariationTypeOption::create([
                    'variation_type_id' => $variationType->id,
                    'name' => $optData['name'],
                    'price_modifier' => $optData['price_modifier'],
                    'sort' => $optSort,
                ]);

                $optionIds[] = [
                    'id' => $option->id,
                    'modifier' => $optData['price_modifier'],
                ];
            }

            $typeOptionIds[] = $optionIds;
        }

        $now = now();

        if (count($typeOptionIds) === 1) {
            foreach ($typeOptionIds[0] as $opt) {
                $ids = [$opt['id']];
                sort($ids);

                DB::table('product_variations')->insert([
                    'product_id' => $product->id,
                    'variation_type_option_ids' => json_encode($ids),
                    'price' => $product->price + $opt['modifier'],
                    'quantity' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    /**
     * Resolve a product image: prefer a locally supplied image, otherwise
     * fetch a random one from Picsum and cache it to the public disk.
     */
  private function resolveImage(string $title): ?string
{
    $local = $this->findLocalImage($title);

    if ($local) {
        return $local;
    }

    return $this->fetchRandomImage($title);
}

private function findLocalImage(string $title): ?string
{
    $slug = Str::slug($title);
    $sourceDir = base_path('database/seeders/images/products');

    foreach (['jpg', 'jpeg', 'png', 'webp'] as $ext) {
        $path = "{$sourceDir}/{$slug}.{$ext}";

        if (is_file($path)) {
            return $path;
        }
    }

    return null;
}

private function fetchRandomImage(string $title): ?string
{
    $slug = Str::slug($title);

    $sourceDir = base_path('database/seeders/images/products');

    if (! is_dir($sourceDir)) {
        mkdir($sourceDir, 0755, true);
    }

    $destPath = "{$sourceDir}/{$slug}.jpg";

    if (is_file($destPath)) {
        return $destPath;
    }

    $imageUrls = [
        'snapback-cap' => 'https://cdn.pixabay.com/photo/2025/05/28/17/14/hats-9627845_1280.jpg',
        'event-poster' => 'https://cdn.pixabay.com/photo/2017/10/29/07/35/poster-2899083_1280.jpg',
        'tote-bag'    => 'https://cdn.pixabay.com/photo/2022/04/01/08/58/tote-bag-7104386_1280.jpg',
        'enamel-mug'  => 'https://cdn.pixabay.com/photo/2016/05/18/04/02/coffee-1399804_1280.jpg',
    ];

    $url = $imageUrls[$slug] ?? null;

    if (! $url) {
        $this->command->warn("No image URL for '{$title}'.");
        return null;
    }

    try {
        $this->command->info("Downloading image for '{$title}'...");

        $response = Http::timeout(30)
            ->retry(2, 1000)
            ->get($url);

        if (! $response->successful()) {
            $this->command->warn(
                "Download failed for '{$title}' - HTTP {$response->status()}"
            );

            return null;
        }

        file_put_contents($destPath, $response->body());

        if (! is_file($destPath)) {
            $this->command->warn(
                "Image was not created: {$destPath}"
            );

            return null;
        }

        $this->command->info(
            "Image saved: {$destPath}"
        );

        return $destPath;

    } catch (Throwable $e) {
        $this->command->warn(
            "Image download failed for '{$title}': {$e->getMessage()}"
        );

        return null;
    }
}
}

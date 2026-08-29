<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Event;
use App\Models\Product;
use App\Models\VariationType;
use App\Models\VariationTypeOption;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
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
        Department $dept,
        $eventCategory,
        int $vendorUserId
    ): void {
        $slug = Str::slug($data['title']);

        $product = Product::firstOrCreate(
            ['slug' => $slug],
            [
                'title' => $data['title'],
                'description' => $data['title'] . ' — official event merchandise.',
                'price' => $data['price'],
                'category_id' => $eventCategory->id,
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
            $imagePath = $this->findLocalImage($data['title'], forceRefresh: true);

            if ($imagePath) {
                $product->clearMediaCollection('images');

                $fullPath = Storage::disk('public')->path($imagePath);

                $product->addMedia($fullPath)
                    ->preservingOriginal()
                    ->toMediaCollection('images');
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

    private function findLocalImage(
        string $title,
        bool $forceRefresh = false
    ): ?string {
        $slug = Str::slug($title);
        $sourceDir = base_path('database/seeders/images/products');
        $extensions = ['jpg', 'jpeg', 'png', 'webp'];

        foreach ($extensions as $ext) {
            $sourcePath = "{$sourceDir}/{$slug}.{$ext}";

            if (file_exists($sourcePath)) {
                $destPath = "products/{$slug}.{$ext}";

                if (
                    $forceRefresh ||
                    ! Storage::disk('public')->exists($destPath)
                ) {
                    Storage::disk('public')->put(
                        $destPath,
                        file_get_contents($sourcePath)
                    );
                }

                return $destPath;
            }
        }

        return null;
    }
}

<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Department;
use App\Models\Product;
use App\Models\User;
use App\Models\VariationType;
use App\Models\VariationTypeOption;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
       $vendorUser = User::where('email', 'info@rbhairlounge.com.au')->first();
        $dept       = Department::where('slug', 'hair-salon')->first();

        $cat = fn (string $name) => Category::where('name', $name)
            ->where('department_id', $dept->id)
            ->whereNull('parent_id')
            ->first();

        // Each product belongs DIRECTLY to one of the 9 flat categories.
        // 'category' here is the top-level category name, not a subcategory.
        $products = [

            // ── Hair Straightening ──────────────────────────────
            ['title' => 'Permanent Hair Straight', 'price' => 220.00, 'category' => 'Hair Straightening', 'highlight' => 'trending'],
            ['title' => 'Temporary Hair Straight', 'price' => 60.00,  'category' => 'Hair Straightening', 'highlight' => null],

            // ── Hair Treatment ───────────────────────────────────
            ['title' => 'Normal Keratin Treatment',     'price' => 150.00, 'category' => 'Hair Treatment', 'highlight' => null],
            ['title' => 'Brazilian Keratin Treatment',  'price' => 200.00, 'category' => 'Hair Treatment', 'highlight' => 'hot'],
            ['title' => 'Basin Treatment',              'price' => 45.00,  'category' => 'Hair Treatment', 'highlight' => null],
            ['title' => 'Hair Protein Treatment',       'price' => 80.00,  'category' => 'Hair Treatment', 'highlight' => null],
            ['title' => 'Charcoal Treatment',           'price' => 70.00,  'category' => 'Hair Treatment', 'highlight' => 'new'],
            ['title' => 'Wash and Blowdry',             'price' => 40.00,  'category' => 'Hair Treatment', 'highlight' => null],
            ['title' => 'Hair Oil Massage',             'price' => 35.00,  'category' => 'Hair Treatment', 'highlight' => null],

            // ── Colour & Foils ────────────────────────────────────
            ['title' => 'Herbal Henna',       'price' => 50.00,  'category' => 'Colour & Foils', 'highlight' => null],
            ['title' => 'Toner',              'price' => 40.00,  'category' => 'Colour & Foils', 'highlight' => null],
            ['title' => 'Regrowth',           'price' => 65.00,  'category' => 'Colour & Foils', 'highlight' => null],
            ['title' => 'Full Hair Colour',   'price' => 120.00, 'category' => 'Colour & Foils', 'highlight' => 'sale'],
            ['title' => 'Full Head Foils',    'price' => 160.00, 'category' => 'Colour & Foils', 'highlight' => 'trending'],
            ['title' => 'Half Head Foils',    'price' => 110.00, 'category' => 'Colour & Foils', 'highlight' => null],
            ['title' => "Men's Hair Colour",  'price' => 55.00,  'category' => 'Colour & Foils', 'highlight' => null],

            // ── Hair Cut (Hair Wash +$10 add-on) ─────────────────
            [
                'title' => 'Kids Hair Cut', 'price' => 30.00, 'category' => 'Hair Cut', 'highlight' => null,
                'variations' => [
                    ['name' => 'Add-ons', 'type' => 'checkbox', 'options' => [
                        ['name' => 'Hair Wash', 'price_modifier' => 10],
                    ]],
                ],
            ],
            [
                'title' => 'Hair Trimming', 'price' => 25.00, 'category' => 'Hair Cut', 'highlight' => null,
                'variations' => [
                    ['name' => 'Add-ons', 'type' => 'checkbox', 'options' => [
                        ['name' => 'Hair Wash', 'price_modifier' => 10],
                    ]],
                ],
            ],
            [
                'title' => 'Style Hair', 'price' => 50.00, 'category' => 'Hair Cut', 'highlight' => null,
                'variations' => [
                    ['name' => 'Add-ons', 'type' => 'checkbox', 'options' => [
                        ['name' => 'Hair Wash', 'price_modifier' => 10],
                    ]],
                ],
            ],

            // ── Facial ────────────────────────────────────────────
            ['title' => 'Normal Cleansing',          'price' => 40.00, 'category' => 'Facial', 'highlight' => null],
            ['title' => 'Fruit Facial',               'price' => 55.00, 'category' => 'Facial', 'highlight' => null],
            ['title' => 'Normal Facial',              'price' => 50.00, 'category' => 'Facial', 'highlight' => null],
            ['title' => 'Aroma Acne Facial',          'price' => 65.00, 'category' => 'Facial', 'highlight' => null],
            ['title' => 'Aroma Pigmentation Facial',  'price' => 70.00, 'category' => 'Facial', 'highlight' => null],
            ['title' => 'Shahnaz Normal Facial',      'price' => 60.00, 'category' => 'Facial', 'highlight' => null],
            ['title' => 'Shahnaz Gold Facial',        'price' => 90.00, 'category' => 'Facial', 'highlight' => 'trending'],
            ['title' => 'Advance Vitamin C Facial',   'price' => 85.00, 'category' => 'Facial', 'highlight' => 'new'],

            // ── Face Bleach ───────────────────────────────────────
            ['title' => 'Fruit Bleach', 'price' => 30.00, 'category' => 'Face Bleach', 'highlight' => null],
            ['title' => 'Gold Bleach',  'price' => 45.00, 'category' => 'Face Bleach', 'highlight' => null],

            // ── Threading ─────────────────────────────────────────
            ['title' => 'Eyebrows Threading',    'price' => 12.00, 'category' => 'Threading', 'highlight' => null],
            ['title' => 'Upperlips Threading',   'price' => 8.00,  'category' => 'Threading', 'highlight' => null],
            ['title' => 'Forehead Threading',    'price' => 8.00,  'category' => 'Threading', 'highlight' => null],
            ['title' => 'Chin Threading',        'price' => 8.00,  'category' => 'Threading', 'highlight' => null],
            ['title' => 'Neck Line Threading',   'price' => 10.00, 'category' => 'Threading', 'highlight' => null],
            ['title' => 'Side Cheeks Threading', 'price' => 10.00, 'category' => 'Threading', 'highlight' => null],
            ['title' => 'Full Face Threading',   'price' => 35.00, 'category' => 'Threading', 'highlight' => 'hot'],

            // ── Eye Treatment ─────────────────────────────────────
            ['title' => 'Eyebrows Tint',             'price' => 20.00, 'category' => 'Eye Treatment', 'highlight' => null],
            ['title' => 'Eyelashes Tint',            'price' => 25.00, 'category' => 'Eye Treatment', 'highlight' => null],
            ['title' => 'Brows & Lashes Tint Combo', 'price' => 40.00, 'category' => 'Eye Treatment', 'highlight' => 'sale'],

            // ── Waxing ────────────────────────────────────────────
            ['title' => 'Eyebrows Waxing',    'price' => 15.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Upperlips Waxing',   'price' => 10.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Forehead Waxing',    'price' => 10.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Chin Waxing',        'price' => 10.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Sides Waxing',       'price' => 12.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Side Cheeks Waxing', 'price' => 12.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Full Face Waxing',   'price' => 40.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Full Legs Waxing',   'price' => 55.00,  'category' => 'Waxing', 'highlight' => 'trending'],
            ['title' => 'Half Legs Waxing',   'price' => 35.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Full Arms Waxing',   'price' => 35.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Half Arms Waxing',   'price' => 22.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Under Arms Waxing',  'price' => 15.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Front Wax',          'price' => 25.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Back Wax',           'price' => 30.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Stomach Waxing',     'price' => 20.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Bikini Waxing',      'price' => 30.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'High Bikini Waxing', 'price' => 40.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Brazilian Wax',      'price' => 55.00,  'category' => 'Waxing', 'highlight' => 'hot'],
            ['title' => 'Buttocks Waxing',    'price' => 25.00,  'category' => 'Waxing', 'highlight' => null],
            ['title' => 'Full Body Wax',      'price' => 150.00, 'category' => 'Waxing', 'highlight' => 'trending'],
        ];

        foreach ($products as $data) {
            $category = $cat($data['category']);

            if (! $category) {
                $this->command->warn("Category not found: {$data['category']} — skipping {$data['title']}.");
                continue;
            }

            $slug = Str::slug($data['title']);

            $product = Product::firstOrCreate(
                ['slug' => $slug],
                [
                    'title'                   => $data['title'],
                    'description'             => $data['title'] . ' service at our hair salon.',
                    'price'                   => $data['price'],
                    'category_id'             => $category->id,
                    'department_id'           => $dept->id,
                    'status'                  => 'published',
                    'highlight'               => $data['highlight'],
                    'product_type'            => 'product',
                    'require_additional_file' => false,
                    'created_by'              => $vendorUser->id,
                    'updated_by'              => $vendorUser->id,
                ]
            );

            if ($product->wasRecentlyCreated || $product->getMedia('images')->isEmpty()) {
              $imagePath = $this->findLocalImage($data['title'], forceRefresh: true);
if ($imagePath) {
    $product->clearMediaCollection('images'); // wipe old media before re-adding
    $fullPath = Storage::disk('public')->path($imagePath);
    $product->addMedia($fullPath)
        ->preservingOriginal()
        ->toMediaCollection('images');
}
            }

            if ($product->variationTypes()->exists()) {
                continue;
            }

            $variations = $data['variations'] ?? [];
            if (empty($variations)) {
                continue;
            }

            $typeOptionIds = [];

            foreach ($variations as $sort => $varData) {
                $variationType = VariationType::create([
                    'product_id' => $product->id,
                    'name'       => $varData['name'],
                    'type'       => $varData['type'],
                    'sort'       => $sort,
                ]);

                $optionIds = [];
                foreach ($varData['options'] as $optSort => $optData) {
                    $option = VariationTypeOption::create([
                        'variation_type_id' => $variationType->id,
                        'name'              => $optData['name'],
                        'price_modifier'    => $optData['price_modifier'],
                        'sort'              => $optSort,
                    ]);
                    $optionIds[] = ['id' => $option->id, 'modifier' => $optData['price_modifier']];
                }

                $typeOptionIds[] = $optionIds;
            }

            $now = now();

            if (count($typeOptionIds) === 1) {
                foreach ($typeOptionIds[0] as $opt) {
                    $ids = [$opt['id']];
                    sort($ids);
                    DB::table('product_variations')->insert([
                        'product_id'                => $product->id,
                        'variation_type_option_ids' => json_encode($ids),
                        'price'                     => $product->price + $opt['modifier'],
                        'quantity'                  => null,
                        'created_at'                => $now,
                        'updated_at'                => $now,
                    ]);
                }
            }

            if (count($typeOptionIds) === 2) {
                foreach ($typeOptionIds[0] as $opt1) {
                    foreach ($typeOptionIds[1] as $opt2) {
                        $ids = [$opt1['id'], $opt2['id']];
                        sort($ids);
                        DB::table('product_variations')->insert([
                            'product_id'                => $product->id,
                            'variation_type_option_ids' => json_encode($ids),
                            'price'                     => $product->price + $opt1['modifier'] + $opt2['modifier'],
                            'quantity'                  => null,
                            'created_at'                => $now,
                            'updated_at'                => $now,
                        ]);
                    }
                }
            }
        }
    }

    /**
     * Looks for a source image in database/seeders/images/products/
     * (where the Pexels fetch script saves files) matching the product
     * title slug. Copies it into storage/app/public/products/ and
     * returns the relative path used by addMedia().
     */
  private function findLocalImage(string $title, bool $forceRefresh = false): ?string
{
    $slug = Str::slug($title);
    $sourceDir = base_path('database/seeders/images/products');
    $extensions = ['jpg', 'jpeg', 'png', 'webp'];

    foreach ($extensions as $ext) {
        $sourcePath = "{$sourceDir}/{$slug}.{$ext}";

        if (file_exists($sourcePath)) {
            $destPath = "products/{$slug}.{$ext}";

            if ($forceRefresh || ! Storage::disk('public')->exists($destPath)) {
                Storage::disk('public')->put($destPath, file_get_contents($sourcePath));
            }

            return $destPath;
        }
    }

    return null;
}
}

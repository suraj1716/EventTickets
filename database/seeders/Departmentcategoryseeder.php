<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DepartmentCategorySeeder extends Seeder
{
    public function run(): void
    {
        $dept = Department::firstOrCreate(
            ['slug' => 'hair-salon'],
            [
                'name'             => 'Hair Salon',
                'meta_title'       => 'Hair Salon Services',
                'meta_description' => 'Professional hair and beauty services in Sydney',
                'active'           => true,
            ]
        );

        $vendorOwnerId = User::where(
            'email',
            config('services.vendor_owner_email')
        )->value('id');

        if (! $vendorOwnerId) {
            $this->command?->warn(
                'DepartmentCategorySeeder: vendor owner user not found — created_by will be null.'
            );
        }

        $categories = [
            'Hair Straightening',
            'Hair Treatment',
            'Colour & Foils',
            'Hair Cut',
            'Facial',
            'Face Bleach',
            'Threading',
            'Eye Treatment',
            'Waxing',
        ];

        foreach ($categories as $name) {
            $slug = Str::slug($name);

            Category::updateOrCreate(
                [
                    'name'          => $name,
                    'department_id' => $dept->id,
                    'parent_id'     => null,
                ],
                [
                    'slug'       => $slug,
                    'active'     => true,
                    'image'      => $this->findLocalImage($name, true),
                    'created_by' => $vendorOwnerId,
                ]
            );

            $this->command?->info(
                "Category '{$name}' seeded."
            );
        }
    }

    private function findLocalImage(
        string $name,
        bool $forceRefresh = false
    ): ?string {
        $slug = Str::slug($name);

        $sourceDir = base_path(
            'database/seeders/images/categories'
        );

        $extensions = [
            'jpg',
            'jpeg',
            'png',
            'webp',
        ];

        foreach ($extensions as $ext) {
            $sourcePath = "{$sourceDir}/{$slug}.{$ext}";

            if (file_exists($sourcePath)) {
                $destPath = "categories/{$slug}.{$ext}";

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

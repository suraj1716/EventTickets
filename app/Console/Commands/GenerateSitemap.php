<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Department;
use App\Models\Product;
use App\Models\Vendor;
use Illuminate\Console\Command;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;

class GenerateSitemap extends Command
{
    protected $signature = 'sitemap:generate';
    protected $description = 'Regenerate public/sitemap.xml from current products, categories, departments, and vendors';

    public function handle()
    {
        $sitemap = Sitemap::create();

        // ── Static high-value pages ──────────────────────────────
        $sitemap->add(Url::create('/')->setPriority(1.0));
        $sitemap->add(Url::create(route('shop.search'))->setPriority(0.9));

        // ── Published products (forWebsite scope = published + vendor approved) ──
        Product::forWebsite()->select('id', 'slug', 'updated_at')->chunk(200, function ($products) use ($sitemap) {
            foreach ($products as $product) {
                $sitemap->add(
                    Url::create(route('product.show', $product))
                        ->setLastModificationDate($product->updated_at)
                        ->setPriority(0.8)
                );
            }
        });

        // ── Categories with at least one published product ──
        Category::whereHas('products', fn($q) => $q->where('status', 'published'))
            ->select('id', 'updated_at')
            ->chunk(200, function ($categories) use ($sitemap) {
                foreach ($categories as $category) {
                    $sitemap->add(
                        Url::create(route('category.show', $category))
                            ->setLastModificationDate($category->updated_at)
                            ->setPriority(0.6)
                    );
                }
            });

        // ── Departments (product.byDepartment => d/{department}) ──
        Department::select('id', 'slug', 'updated_at')->chunk(200, function ($departments) use ($sitemap) {
            foreach ($departments as $department) {
                $sitemap->add(
                    Url::create(route('product.byDepartment', $department))
                        ->setLastModificationDate($department->updated_at)
                        ->setPriority(0.6)
                );
            }
        });

        // ── Approved vendor pages (vendor.profile => seller/{vendor}) ──
        Vendor::where('status', 'approved')->select('user_id', 'store_name', 'updated_at')->chunk(200, function ($vendors) use ($sitemap) {
            foreach ($vendors as $vendor) {
                $sitemap->add(
                    Url::create(route('vendor.profile', $vendor))
                        ->setLastModificationDate($vendor->updated_at)
                        ->setPriority(0.5)
                );
            }
        });

        $sitemap->writeToFile(public_path('sitemap.xml'));

        $this->info('Sitemap generated: ' . Product::forWebsite()->count() . ' products, '
            . Category::whereHas('products')->count() . ' categories, '
            . Department::count() . ' departments, '
            . Vendor::where('status', 'approved')->count() . ' vendors.');
    }
}

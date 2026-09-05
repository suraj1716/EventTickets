<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Gallery;

class GallerySeeder extends Seeder
{
    public function run(): void
    {
        // Use R2 only when it is actually configured.
        // Otherwise fall back to the local public disk for development/seeding.
        $disk = (
            filled(config('filesystems.disks.r2.key')) &&
            filled(config('filesystems.disks.r2.secret')) &&
            filled(config('filesystems.disks.r2.bucket')) &&
            filled(config('filesystems.disks.r2.endpoint'))
        )
            ? 'r2'
            : 'public';

        $this->command->line("Gallery media disk: {$disk}");

        $items = [
            ['title' => 'Keratin Treatment',     'image' => 'keratin-treatment.jpg'],
            ['title' => 'Brazilian Blowout',     'image' => 'brazilian-blowout.jpg'],
            ['title' => 'Deep Conditioning',     'image' => 'deep-conditioning.jpg'],
            ['title' => 'Ladies Haircut',        'image' => 'ladies-haircut.jpg'],
            ['title' => 'Mens Haircut',          'image' => 'mens-haircut.jpg'],
            ['title' => 'Kids Haircut',          'image' => 'kids-haircut.jpg'],
            ['title' => 'Blow Dry & Style',      'image' => 'blow-dry-style.jpg'],
            ['title' => 'Full Colour',           'image' => 'full-hair-colour.jpg'],
            ['title' => 'Highlights & Balayage', 'image' => 'highlights-balayage.jpg'],
            ['title' => 'Root Touch Up',         'image' => 'root-touch-up.jpg'],
            ['title' => 'Classic Manicure',      'image' => 'classic-manicure.jpg'],
            ['title' => 'Classic Pedicure',      'image' => 'classic-pedicure.jpg'],
            ['title' => 'Gel Nails',             'image' => 'gel-nails.jpg'],
            ['title' => 'Eyebrow Threading',     'image' => 'eyebrow-threading.jpg'],
            ['title' => 'Facial Threading',      'image' => 'facial-threading.jpg'],
        ];

        foreach ($items as $item) {
            $source = database_path('seeders/images/products/' . $item['image']);

            if (! file_exists($source)) {
                $this->command->warn("Image not found: {$source}");
                continue;
            }

            // Skip if a gallery with this title already has media attached.
            $existing = Gallery::where('title', $item['title'])->first();

            if ($existing && $existing->getMedia('gallery')->isNotEmpty()) {
                $this->command->line("  ~ skipped (exists): {$item['title']}");
                continue;
            }

            $gallery = $existing ?? Gallery::create([
                'title'  => $item['title'],
                'active' => true,
            ]);

            $gallery
                ->addMedia($source)
                ->preservingOriginal()
                ->toMediaCollection('gallery', $disk);

            $this->command->line("  ✓ {$item['title']}");
        }

        $this->command->info('Gallery seeded successfully.');
    }
}

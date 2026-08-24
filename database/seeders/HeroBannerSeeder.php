<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use App\Models\HeroBanner;

class HeroBannerSeeder extends Seeder
{
    public function run(): void
    {
        $banners = [
            [
                'title'       => 'Where Beauty Meets Mastery',
                'subtitle'    => 'Bespoke colour, precision cuts, and transformative rituals — crafted for you by Sydney\'s finest stylists.',
                'button_text' => 'Book a Consultation',
                'button_link' => '/shop',
                'image'       => 'brazilian-blowout.jpg',
                'is_active'   => true,
            ],
            [
                'title'       => 'Colour That Tells Your Story',
                'subtitle'    => 'From sun-kissed balayage to bold colour corrections, our colourists turn vision into reality.',
                'button_text' => 'Explore Colour Services',
                'button_link' => '/shop',
                'image'       => 'hair-color1.jpg',
                'is_active'   => true,
            ],
            [
                'title'       => 'Rituals for Hair & Soul',
                'subtitle'    => 'Indulge in our signature scalp treatments and restorative hair rituals — because you deserve more than a haircut.',
                'button_text' => 'View Treatments',
                'button_link' => '/shop',
                'image'       => 'brazilian-keratin-treatment.jpg',
                'is_active'   => true,
            ],
            [
                'title'       => 'Hair, Perfected',
                'subtitle'    => 'Your wedding day deserves flawless hair. Our bridal team crafts looks that photograph beautifully and last all day.',
                'button_text' => 'Enquire Now',
                'button_link' => '/contact',
                'image'       => 'brazilian-keratin-treatment.jpg',
                'is_active'   => false,
            ],
        ];

        foreach ($banners as $data) {
            $source     = database_path('seeders/images/hero/' . $data['image']);
            $image_path = 'banners/' . $data['image'];

            if (file_exists($source)) {
                Storage::disk('public')->put(
                    $image_path,
                    file_get_contents($source)
                );
            } else {
                $this->command->warn("Image not found: {$source}");
            }

            HeroBanner::updateOrCreate(
                ['title' => $data['title']],
                [
                    'title'       => $data['title'],
                    'subtitle'    => $data['subtitle'],
                    'button_text' => $data['button_text'],
                    'button_link' => $data['button_link'],
                    'image_path'  => $image_path,
                    'is_active'   => $data['is_active'],
                ]
            );
        }
    }
}

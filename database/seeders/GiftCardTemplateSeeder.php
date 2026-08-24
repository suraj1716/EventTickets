<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\GiftCardTemplate;

class GiftCardTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'title' => '$20 Gift Card',
                'description' => 'Perfect for a small treat or beauty service add-on.',
                'amount' => 20,
                'image_path' => null,
                'active' => true,
                'sort_order' => 1,
            ],
            [
                'title' => '$50 Gift Card',
                'description' => 'A thoughtful gift for your loved ones.',
                'amount' => 50,
                'image_path' => null,
                'active' => true,
                'sort_order' => 2,
            ],
            [
                'title' => '$100 Gift Card',
                'description' => 'A premium gift card for salon services.',
                'amount' => 100,
                'image_path' => null,
                'active' => true,
                'sort_order' => 3,
            ],
            [
                'title' => '$200 Gift Card',
                'description' => 'A complete beauty experience gift card.',
                'amount' => 200,
                'image_path' => null,
                'active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($templates as $template) {
            GiftCardTemplate::updateOrCreate(
                [
                    'amount' => $template['amount'],
                ],
                $template
            );
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            ['question' => 'Can I transfer a ticket?', 'answer' => 'Ticket transfers depend on the event and ticket rules configured by the organiser.'],
            ['question' => 'How do I find my event?', 'answer' => 'Use the event categories and search to browse upcoming Australian events.'],
            ['question' => 'Are prices shown in AUD?', 'answer' => 'The development dataset uses Australian dollar pricing.'],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(['question' => $faq['question']], ['answer' => $faq['answer']]);
        }
    }
}

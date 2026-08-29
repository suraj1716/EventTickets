<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Contact;
use App\Models\Department;
use Illuminate\Database\Seeder;

class ContactSeeder extends Seeder
{
    public function run(): void
    {
        Contact::updateOrCreate(
            ['email' => 'demo.customer@eventtickets.test', 'message' => 'Demo enquiry about an upcoming event.'],
            [
                'name' => 'Demo Customer',
                'phone' => '+61 400 500 001',
                'reason' => 'Event enquiry',
                'department_id' => Department::where('slug', 'events-entertainment')->value('id'),
                'category_id' => Category::where('slug', 'live-music')->value('id'),
                'product_id' => null,
                'quantity' => null,
                'file_path' => null,
                'is_read' => false,
            ]
        );
    }
}

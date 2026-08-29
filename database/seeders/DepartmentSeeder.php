<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            'Electronics',
            'Fashion',
            'Home, Garden & Tools',
            'Books & Audible',
            'Health & beauty',
        ];

        foreach ($departments as $name) {
            $slug = Str::slug($name);

            DB::table('departments')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'active' => true,
                    'updated_at' => now(),
                ]
            );

            $this->command?->info(
                "Department '{$name}' seeded."
            );
        }
    }
}

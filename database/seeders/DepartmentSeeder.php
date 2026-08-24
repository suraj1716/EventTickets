<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB ;
use Illuminate\Support\Str;



class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments=[
            [
            'name'=>'Electronics',
            'slug'=>'electronics',
            'active'=>true,
            'created_at'=>now(),
            'updated_at'=>now()
        ],
        [
            'name'=>'Fashion',
            'slug'=>'fashion',
            'active'=>true,
            'created_at'=>now(),
            'updated_at'=>now()
        ],
        [
            'name'=>'Home, Garden & Tools',
            'slug'=>Str::slug('Home, Garden & Tools'),
            'active'=>true,
            'created_at'=>now(),
            'updated_at'=>now()
        ],
        [
            'name'=>'Books & Audible',
            'slug'=>Str::slug('Books & Audible'),
            'active'=>true,
            'created_at'=>now(),
            'updated_at'=>now()
        ],
        [
            'name'=>'Health & beauty',
            'slug'=>Str::slug('Health & beauty'),

            'active'=>true,
            'created_at'=>now(),
            'updated_at'=>now()
        ],

        ];

        DB::table('departments')->insert($departments);

    }
}

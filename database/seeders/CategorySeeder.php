<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\CategoryGroup;
use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $department = Department::where('slug', 'events-entertainment')->firstOrFail();
        $creator = User::where('email', 'admin@eventtickets.test')->firstOrFail();

        $categories = [
            'Live Music' => null,
            'Concerts' => null,
            'Festivals' => null,
            'Comedy' => null,
            'Theatre' => null,
            'Sports' => null,
            'Workshops' => null,
            'Conferences' => null,
            'Family Events' => null,
            'Cultural Events' => null,
            'Food & Drink' => null,
            'Kids & Family' => 'Family Events',
        ];

        $models = [];
        foreach ($categories as $name => $parentName) {
            $parent = $parentName ? ($models[$parentName] ?? Category::where('name', $parentName)->first()) : null;
            $models[$name] = Category::updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'description' => "Australian {$name} events and experiences.",
                    'department_id' => $department->id,
                    'parent_id' => $parent?->id,
                    'active' => true,
                    'created_by' => $creator->id,
                ]
            );
        }

        $groups = [
            'Popular Events' => ['Live Music', 'Concerts', 'Comedy', 'Theatre'],
            'Experiences' => ['Festivals', 'Workshops', 'Conferences', 'Cultural Events'],
            'Sports & Live Shows' => ['Sports', 'Family Events', 'Kids & Family'],
        ];

        foreach ($groups as $groupName => $names) {
            $group = CategoryGroup::where('name', $groupName)->firstOrFail();
            $group->categories()->sync(collect($names)->map(fn ($n) => $models[$n]->id)->all());
        }
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add the column as nullable first (no unique constraint yet)
        Schema::table('categories', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
        });

        // 2. Backfill existing rows from their name
        $categories = DB::table('categories')->select('id', 'name')->get();

        $usedSlugs = [];

        foreach ($categories as $category) {
            $base = Str::slug($category->name);
            $slug = $base;
            $i = 2;

            while (in_array($slug, $usedSlugs, true)) {
                $slug = "{$base}-{$i}";
                $i++;
            }

            $usedSlugs[] = $slug;

            DB::table('categories')
                ->where('id', $category->id)
                ->update(['slug' => $slug]);
        }

        // 3. Now that every row has a value, enforce NOT NULL + UNIQUE
        Schema::table('categories', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->unique()->change();
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['categories_slug_unique']);
            $table->dropColumn('slug');
        });
    }
};

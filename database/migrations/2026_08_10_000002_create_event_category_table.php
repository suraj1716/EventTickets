<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Pivot against your existing `categories` table (reused from the salon platform)
    public function up(): void
    {
        Schema::create('event_category', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['event_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_category');
    }
};

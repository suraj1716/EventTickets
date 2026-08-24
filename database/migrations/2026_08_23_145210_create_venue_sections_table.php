<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venue_sections', function (Blueprint $table) {
            $table->id();

            $table->foreignId('venue_id')
                ->constrained('venues')
                ->cascadeOnDelete();

            $table->string('name');
            $table->string('code')->nullable();

            $table->unsignedInteger('sort_order')->default(0);

            $table->unsignedInteger('capacity')->default(0);

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['venue_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venue_sections');
    }
};

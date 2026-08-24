<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('variation_type_options', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('sort')->nullable();
            $table->foreignId('variation_type_id')->constrained('variation_types')->cascadeOnDelete();
            $table->string('name');
            $table->decimal('price_modifier', 10, 2)->default(0.00);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variation_type_options');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venue_seats', function (Blueprint $table) {
            $table->id();

            $table->foreignId('venue_id')
                ->constrained('venues')
                ->cascadeOnDelete();

            $table->foreignId('venue_section_id')
                ->nullable()
                ->constrained('venue_sections')
                ->nullOnDelete();

            $table->string('row_label')->nullable();

            $table->unsignedInteger('seat_number')->nullable();

            $table->string('label');

            $table->string('seat_type')->default('standard');

            /*
             * Optional visual seat-map coordinates.
             */
            $table->decimal('x', 10, 3)->nullable();
            $table->decimal('y', 10, 3)->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index([
                'venue_id',
                'venue_section_id',
            ]);

            $table->unique([
                'venue_id',
                'label',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venue_seats');
    }
};

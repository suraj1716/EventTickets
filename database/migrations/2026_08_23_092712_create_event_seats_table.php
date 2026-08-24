<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_seats', function (Blueprint $table) {
            $table->id();

            $table->foreignId('event_leg_id')
                ->constrained('event_legs')
                ->cascadeOnDelete();

            $table->foreignId('ticket_tier_id')
                ->nullable()
                ->constrained('ticket_tiers')
                ->nullOnDelete();

            $table->string('row_label', 20);
            $table->unsignedInteger('seat_number');
            $table->string('label', 50);

            $table->enum('status', [
                'available',
                'reserved',
                'sold',
                'blocked',
            ])->default('available');

            $table->timestamps();

            $table->unique(
                ['event_leg_id', 'row_label', 'seat_number'],
                'event_seats_leg_row_number_unique'
            );

            $table->index(['event_leg_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_seats');
    }
};

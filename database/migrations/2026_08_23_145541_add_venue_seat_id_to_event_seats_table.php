<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_seats', function (Blueprint $table) {
            $table->foreignId('venue_seat_id')
                ->nullable()
                ->after('event_leg_id')
                ->constrained('venue_seats')
                ->nullOnDelete();

            $table->index([
                'event_leg_id',
                'venue_seat_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('event_seats', function (Blueprint $table) {
            $table->dropForeign(['venue_seat_id']);
            $table->dropColumn('venue_seat_id');
        });
    }
};

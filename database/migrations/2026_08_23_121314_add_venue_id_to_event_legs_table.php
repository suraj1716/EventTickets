<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_legs', function (Blueprint $table) {
            // Nullable + nullOnDelete: a leg can still exist as a one-off
            // location with no catalog venue attached, and deleting a
            // venue must never cascade-delete the events/tickets that
            // reference it — it should just detach.
            //
            // venue_name/address/city/latitude/longitude on event_legs
            // are NOT removed by this migration. They stay as a snapshot
            // of the venue at the time the leg was created/saved, so a
            // later edit to the Venue record (rename, address fix) never
            // silently rewrites historical event/ticket data.
            $table->foreignId('venue_id')
                ->nullable()
                ->after('event_id')
                ->constrained('venues')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('event_legs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('venue_id');
        });
    }
};

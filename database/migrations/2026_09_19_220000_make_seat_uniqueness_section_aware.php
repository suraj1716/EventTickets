<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * Row/seat identity was venue-wide, so "Row A, Seat 1" could exist only once
 * per venue (and once per event leg). Any venue with more than one section
 * reusing row letters (stalls/circle, stadium blocks) collided.
 *
 * This makes uniqueness section-aware. Postgres treats NULLs as distinct in
 * unique indexes, so each rule is split into two partial indexes:
 *   - seats WITH a section: unique within that section
 *   - seats WITHOUT a section: keep the old venue-wide rule
 *
 * Existing data can't violate the new rules (they are strictly looser), so
 * this is safe to run against populated tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        // event_seats needs the section directly so its own unique index can
        // be section-aware without joining venue_seats.
        Schema::table('event_seats', function (Blueprint $table) {
            $table->foreignId('venue_section_id')
                ->nullable()
                ->after('venue_seat_id')
                ->constrained('venue_sections')
                ->nullOnDelete();
        });

        DB::statement('
            UPDATE event_seats es
            SET venue_section_id = vs.venue_section_id
            FROM venue_seats vs
            WHERE es.venue_seat_id = vs.id
        ');

        Schema::table('venue_seats', function (Blueprint $table) {
            $table->dropUnique(['venue_id', 'label']);
        });

        Schema::table('event_seats', function (Blueprint $table) {
            $table->dropUnique('event_seats_leg_row_number_unique');
        });

        DB::statement('
            CREATE UNIQUE INDEX venue_seats_section_label_unique
            ON venue_seats (venue_id, venue_section_id, label)
            WHERE venue_section_id IS NOT NULL
        ');
        DB::statement('
            CREATE UNIQUE INDEX venue_seats_no_section_label_unique
            ON venue_seats (venue_id, label)
            WHERE venue_section_id IS NULL
        ');

        DB::statement('
            CREATE UNIQUE INDEX event_seats_section_row_number_unique
            ON event_seats (event_leg_id, venue_section_id, row_label, seat_number)
            WHERE venue_section_id IS NOT NULL
        ');
        DB::statement('
            CREATE UNIQUE INDEX event_seats_no_section_row_number_unique
            ON event_seats (event_leg_id, row_label, seat_number)
            WHERE venue_section_id IS NULL
        ');
    }

    /*
     * Reverting re-imposes the venue-wide rule, so it will fail if any venue
     * now has the same row/seat in two sections. That is intended.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS event_seats_no_section_row_number_unique');
        DB::statement('DROP INDEX IF EXISTS event_seats_section_row_number_unique');
        DB::statement('DROP INDEX IF EXISTS venue_seats_no_section_label_unique');
        DB::statement('DROP INDEX IF EXISTS venue_seats_section_label_unique');

        Schema::table('event_seats', function (Blueprint $table) {
            $table->unique(
                ['event_leg_id', 'row_label', 'seat_number'],
                'event_seats_leg_row_number_unique'
            );
            $table->dropConstrainedForeignId('venue_section_id');
        });

        Schema::table('venue_seats', function (Blueprint $table) {
            $table->unique(['venue_id', 'label']);
        });
    }
};

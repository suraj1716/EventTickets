<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * category_event and artist_event only have a composite primary key
     * (category_id, event_id) / (artist_id, event_id). Every real query
     * against these tables goes the other direction — "give me the
     * categories/artists for these event IDs" (Event::with('categories')/
     * ('artists')) — which filters on event_id, the column that ISN'T
     * leading in either composite key. Postgres can't use a composite
     * index's later columns for an efficient range/IN scan the way it can
     * the leading one, so this lookup was falling back to a full index or
     * table scan on every /events page load.
     *
     * events.vendor_user_id has no index at all despite being filtered on
     * constantly: the admin dashboard's vendor-scoping, the admin events
     * index, and the public "browse this organizer's events" filter all
     * do WHERE vendor_user_id = ? with nothing but a sequential scan.
     */
    public function up(): void
    {
        Schema::table('category_event', function (Blueprint $table) {
            $table->index('event_id');
        });

        Schema::table('artist_event', function (Blueprint $table) {
            $table->index('event_id');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->index('vendor_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('category_event', function (Blueprint $table) {
            $table->dropIndex(['event_id']);
        });

        Schema::table('artist_event', function (Blueprint $table) {
            $table->dropIndex(['event_id']);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['vendor_user_id']);
        });
    }
};

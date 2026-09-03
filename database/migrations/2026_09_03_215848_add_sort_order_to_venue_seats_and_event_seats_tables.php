<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('venue_seats', function (Blueprint $table) {
    $table->unsignedInteger('sort_order')->default(0)->after('row_label');
});

Schema::table('event_seats', function (Blueprint $table) {
    $table->unsignedInteger('sort_order')->default(0)->after('row_label');
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('venue_seats_and_event_seats_tables', function (Blueprint $table) {
            //
        });
    }
};

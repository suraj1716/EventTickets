<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  // database/migrations/xxxx_xx_xx_add_aisle_after_to_venue_seats_table.php
public function up(): void
{
    Schema::table('venue_seats', function (Blueprint $table) {
        $table->boolean('aisle_after')->default(false)->after('is_active');
    });
}

public function down(): void
{
    Schema::table('venue_seats', function (Blueprint $table) {
        $table->dropColumn('aisle_after');
    });
}
};

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
       Schema::table('vendors', function (Blueprint $table) {
        $table->time('business_start_time')->default('09:00');
        $table->time('business_end_time')->default('17:00');
        $table->integer('slot_interval_minutes')->default(30);
        $table->json('recurring_closed_days')->nullable(); // e.g. [0,6] for Sunday and Saturday
        $table->json('closed_dates')->nullable(); // e.g. ['2025-05-30','2025-06-10']
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::table('vendors', function (Blueprint $table) {
        $table->dropColumn(['business_start_time', 'business_end_time', 'slot_interval_minutes', 'recurring_closed_days', 'closed_dates']);
    });
    }
};

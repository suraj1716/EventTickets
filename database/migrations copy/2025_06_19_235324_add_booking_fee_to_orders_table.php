<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   // database/migrations/xxxx_xx_xx_add_booking_fee_to_orders_table.php
public function up()
{
    Schema::table('orders', function (Blueprint $table) {
        $table->decimal('booking_fee', 10, 2)->default(0)->after('total_price');
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            //
        });
    }
};

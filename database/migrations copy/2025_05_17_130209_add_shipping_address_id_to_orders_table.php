<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('orders', function (Blueprint $table) {
        $table->unsignedBigInteger('shipping_address_id')->nullable()->after('vendor_user_id');

        // Add foreign key constraint if you want (optional)
        $table->foreign('shipping_address_id')->references('id')->on('shipping_addresses')->onDelete('set null');
    });
}

public function down()
{
    Schema::table('orders', function (Blueprint $table) {
        $table->dropForeign(['shipping_address_id']);
        $table->dropColumn('shipping_address_id');
    });
}

};

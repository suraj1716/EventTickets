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
    Schema::table('vendors', function (Blueprint $table) {
        $table->decimal('booking_fee', 10, 2)->nullable()->after('vendor_type');
    });
}

public function down()
{
    Schema::table('vendors', function (Blueprint $table) {
        $table->dropColumn('booking_fee');
    });
}

};

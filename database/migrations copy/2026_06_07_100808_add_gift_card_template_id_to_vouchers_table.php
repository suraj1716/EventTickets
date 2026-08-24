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
    Schema::table('vouchers', function (Blueprint $table) {
        $table->foreignId('gift_card_template_id')->nullable()->constrained()->nullOnDelete();
    });
}

public function down()
{
    Schema::table('vouchers', function (Blueprint $table) {
        $table->dropForeign(['gift_card_template_id']);
        $table->dropColumn('gift_card_template_id');
    });
}
};

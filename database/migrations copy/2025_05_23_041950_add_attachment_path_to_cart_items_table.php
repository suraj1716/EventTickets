<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->string('attachment_path')->nullable()->after('price');
            $table->string('attachment_name')->nullable()->after('attachment_path');
        });
    }

  public function down()
{
    Schema::table('cart_items', function (Blueprint $table) {
        // Drop attachment_path if exists
        if (Schema::hasColumn('cart_items', 'attachment_path')) {
            $table->dropColumn('attachment_path');
        }

        // Drop attachment_name if exists
        if (Schema::hasColumn('cart_items', 'attachment_name')) {
            $table->dropColumn('attachment_name');
        }
    });
}
};

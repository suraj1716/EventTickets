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
    Schema::table('variation_types', function (Blueprint $table) {
        $table->integer('sort')->default(0)->after('id');
    });
}

public function down()
{
    Schema::table('variation_types', function (Blueprint $table) {
        $table->dropColumn('sort');
    });
}

};

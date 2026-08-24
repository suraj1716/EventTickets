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
    Schema::table('product_groups', function (Blueprint $table) {
        $table->dropColumn('image'); // remove old single image field
        $table->json('images')->nullable(); // new multiple image field
    });
}

public function down(): void
{
    Schema::table('product_groups', function (Blueprint $table) {
        $table->dropColumn('images');
        $table->string('image')->nullable();
    });
}
};

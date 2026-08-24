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
        Schema::table('gift_card_templates', function (Blueprint $table) {
    $table->foreignId('vendor_user_id')
        ->nullable()
        ->after('id')
        ->constrained('users')
        ->nullOnDelete();

    $table->index('vendor_user_id');
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gift_card_templates', function (Blueprint $table) {
            //
        });
    }
};

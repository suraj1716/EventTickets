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
    Schema::table('order_items', function (Blueprint $table) {
        if (!Schema::hasColumn('order_items', 'gift_card_template_id')) {
            $table->foreignId('gift_card_template_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
        }
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            //
        });
    }
};

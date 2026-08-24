<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            // Null means it's a regular product cart item
            $table->foreignId('gift_card_template_id')
                  ->nullable()
                  ->after('product_id')
                  ->constrained('gift_card_templates')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropForeign(['gift_card_template_id']);
            $table->dropColumn('gift_card_template_id');
        });
    }
};

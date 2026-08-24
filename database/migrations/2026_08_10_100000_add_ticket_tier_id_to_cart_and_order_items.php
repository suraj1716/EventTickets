<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreignId('ticket_tier_id')->nullable()->after('gift_card_template_id')
                ->constrained('ticket_tiers')->nullOnDelete();
        });

        // Extend the existing enum('product','gift_card') to add 'ticket'.
        // Raw statement because Schema::table()->enum() modification requires
        // doctrine/dbal to be installed — this avoids adding that dependency
        // just for one column change.
        DB::statement("ALTER TABLE cart_items MODIFY item_type ENUM('product', 'gift_card', 'ticket') DEFAULT 'product'");

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('ticket_tier_id')->nullable()->after('gift_card_template_id')
                ->constrained('ticket_tiers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ticket_tier_id');
        });

        DB::statement("ALTER TABLE cart_items MODIFY item_type ENUM('product', 'gift_card') DEFAULT 'product'");

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ticket_tier_id');
        });
    }
};

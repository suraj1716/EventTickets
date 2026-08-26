<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreignId('ticket_tier_id')
                ->nullable()
                ->after('gift_card_template_id')
                ->constrained('ticket_tiers')
                ->nullOnDelete();
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement(
                "ALTER TABLE cart_items
                 MODIFY item_type ENUM('product', 'gift_card', 'ticket')
                 DEFAULT 'product'"
            );
        }

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('ticket_tier_id')
                ->nullable()
                ->after('gift_card_template_id')
                ->constrained('ticket_tiers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ticket_tier_id');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement(
                "ALTER TABLE cart_items
                 MODIFY item_type ENUM('product', 'gift_card')
                 DEFAULT 'product'"
            );
        }

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ticket_tier_id');
        });
    }
};

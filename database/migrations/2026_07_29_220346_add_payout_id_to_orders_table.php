<?php
// save as database/migrations/xxxx_xx_xx_xxxxxx_add_payout_id_to_orders_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('payout_id')
                ->nullable()
                ->after('vendor_subtotal')
                ->constrained('payouts')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payout_id');
        });
    }
};

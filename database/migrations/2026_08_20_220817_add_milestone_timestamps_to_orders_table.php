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
    Schema::table('orders', function (Blueprint $table) {
        $table->timestamp('paid_at')->nullable()->after('is_paid');
        $table->timestamp('fees_calculated_at')->nullable()->after('vendor_subtotal');
        $table->timestamp('paid_out_at')->nullable()->after('payout_id');
    });
}

public function down(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->dropColumn(['paid_at', 'fees_calculated_at', 'paid_out_at']);
    });
}
};

<?php

// database/migrations/xxxx_xx_xx_xxxxxx_add_manual_checkout_fields_to_orders_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->boolean('is_manual')->default(false)->after('stripe_session_id');
            $table->string('payment_method')->nullable()->after('is_manual'); // e.g., cash, bank_transfer
            $table->timestamp('manual_paid_at')->nullable()->after('payment_method'); // when marked paid
            $table->boolean('is_paid')->default(false)->after('manual_paid_at'); // paid status
            $table->text('admin_note')->nullable()->after('is_paid'); // admin remarks or description
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'is_manual',
                'payment_method',
                'manual_paid_at',
                'is_paid',
                'admin_note',
            ]);
        });
    }
};

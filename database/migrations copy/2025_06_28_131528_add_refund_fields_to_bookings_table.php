<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->boolean('booking_fee_refunded')->default(false)->after('google_event_id');
            $table->decimal('booking_fee_refund_amount', 10, 2)->nullable()->after('booking_fee_refunded');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['booking_fee_refunded', 'booking_fee_refund_amount']);
        });
    }
};

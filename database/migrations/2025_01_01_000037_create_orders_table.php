<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->decimal('total_price', 20, 4);
            $table->decimal('stripe_amount', 10, 2)->nullable();
            $table->decimal('booking_fee', 10, 2)->default(0.00);
            $table->decimal('voucher_discount', 10, 2)->default(0.00);
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('vendor_user_id');
            $table->foreignId('staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('shipping_address_id')->nullable()->constrained('shipping_addresses')->nullOnDelete();
            $table->string('status');
            $table->foreignId('voucher_id')->nullable()->constrained('vouchers')->nullOnDelete();
            $table->decimal('discount_amount', 10, 2)->default(0.00);
            $table->string('stripe_session_id')->nullable();
            $table->string('stripe_charge_id')->nullable();
            $table->boolean('is_manual')->default(false);
            $table->string('payment_method')->nullable();
            $table->timestamp('manual_paid_at')->nullable();
            $table->boolean('is_paid')->default(false);
            $table->text('admin_note')->nullable();
            $table->string('payment_intent')->nullable();
            $table->decimal('online_payment_comission', 20, 4)->nullable();
            $table->decimal('website_payment_comission', 20, 4)->nullable();
            $table->decimal('vendor_subtotal', 20, 4)->nullable();
            $table->timestamps();
            $table->timestamp('refunded_at')->nullable();
            $table->string('refund_id')->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->string('refund_reason')->nullable();
            $table->boolean('is_read')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

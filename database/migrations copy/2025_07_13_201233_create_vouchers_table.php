<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();

            // Core identity
            $table->string('code')->unique();
            $table->enum('type', ['gift', 'promo']); // gift = purchasable card, promo = admin discount code

            // Value
            $table->decimal('amount', 10, 2);                          // face value
            $table->enum('discount_type', ['fixed', 'percent'])->default('fixed'); // for promo codes
            $table->decimal('remaining_amount', 10, 2)->nullable();    // tracks gift card balance

            // Usage limits (promo codes)
            $table->integer('max_uses')->nullable();
            $table->integer('used_count')->default(0);

            // Ownership & gifting
            $table->foreignId('purchased_by')->nullable()->constrained('users')->nullOnDelete(); // buyer
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();  // recipient (if registered)
            $table->string('gifted_to_email')->nullable();             // recipient email (before they register)

            // Linked to a gift card product template (nullable for promo codes)
            $table->foreignId('gift_card_product_id')->nullable()->constrained('products')->nullOnDelete();

            // Stripe
            $table->string('stripe_session_id')->nullable();
            $table->string('stripe_coupon_id')->nullable();

            // State
            $table->boolean('active')->default(false); // false until payment confirmed
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('sent_at')->nullable();   // when gift email was dispatched
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};

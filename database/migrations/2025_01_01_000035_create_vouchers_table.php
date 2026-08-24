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
            $table->string('code')->unique();
            $table->enum('type', ['gift', 'promo']);
            $table->decimal('amount', 10, 2);
            $table->enum('discount_type', ['fixed', 'percent'])->default('fixed');
            $table->decimal('remaining_amount', 10, 2)->nullable();
            $table->integer('max_uses')->nullable();
            $table->integer('used_count')->default(0);
            $table->foreignId('purchased_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('gifted_to_email')->nullable();
            $table->foreignId('gift_card_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('stripe_session_id')->nullable();
            $table->string('stripe_coupon_id')->nullable();
            $table->boolean('active')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->foreignId('gift_card_template_id')->nullable()->constrained('gift_card_templates')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->nullable()->constrained('products')->cascadeOnDelete();
            $table->foreignId('gift_card_template_id')->nullable()->constrained('gift_card_templates')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->enum('item_type', ['product', 'gift_card'])->default('product');
            $table->integer('quantity');
            $table->decimal('price', 20, 4);
            $table->decimal('amount', 10, 2)->nullable();
            $table->boolean('designer')->default(false);
            $table->string('attachment_path')->nullable();
            $table->string('attachment_name')->nullable();
            $table->json('variation_type_option_ids');
            $table->boolean('saved_for_later')->default(false);
            $table->timestamps();
            $table->foreignId('voucher_id')->nullable()->constrained('vouchers')->nullOnDelete();
            $table->string('gifted_to_email')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};

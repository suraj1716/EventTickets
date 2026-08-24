<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
             $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('status');
            $table->string('store_name');
            $table->string('store_address')->nullable();
            $table->enum('vendor_type', ['appointment', 'ecommerce'])->default('ecommerce');
            $table->decimal('booking_fee', 10, 2)->nullable();
            $table->string('cover_image')->nullable();
            $table->timestamps();
            $table->time('business_start_time')->default('09:00:00');
            $table->time('business_end_time')->default('17:00:00');
            $table->integer('slot_interval_minutes')->default(30);
            $table->unsignedInteger('total_seats')->default(1);
            $table->json('recurring_closed_days')->nullable();
            $table->json('closed_dates')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};

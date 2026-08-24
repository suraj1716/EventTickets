<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained('orders')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id');
            $table->date('booking_date');
            $table->boolean('is_read')->default(false);
            $table->string('time_slot');
            $table->timestamps();
            $table->string('google_event_id')->nullable();
            $table->boolean('booking_fee_refunded')->default(false);
            $table->decimal('booking_fee_refund_amount', 10, 2)->nullable();
            $table->foreignId('staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->timestamp('edited_at')->nullable();
            $table->foreignId('preferred_staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('assigned_staff_id')->nullable()->constrained('staff')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};

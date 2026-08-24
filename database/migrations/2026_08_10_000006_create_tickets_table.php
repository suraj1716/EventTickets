<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();

            // assumes your existing multivendor `orders` table
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ticket_tier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_leg_id')->constrained()->cascadeOnDelete();

            // signed/opaque identity encoded into the QR + barcode.
            // never expose the auto-increment id directly on the code.
            $table->string('code', 64)->unique();

            $table->string('qr_path')->nullable();
            $table->string('barcode_path')->nullable();

            // optional per-ticket attendee info (buyer can name each ticket
            // for entry lists / transfers without changing order ownership)
            $table->string('holder_name')->nullable();
            $table->string('holder_email')->nullable();

            $table->enum('status', ['valid', 'used', 'void'])->default('valid');
            $table->timestamp('scanned_at')->nullable();
            $table->foreignId('scanned_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['event_leg_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_staff', function (Blueprint $table) {
            $table->id();

            // The vendor owner (a User with the 'vendor' role). This value
            // doubles as the spatie team id ('vendor_id' pivot column).
            $table->foreignId('vendor_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // The staff member (a User with the 'staff' role).
            $table->foreignId('staff_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('status', ['invited', 'active', 'suspended'])
                ->default('invited');

            $table->timestamp('invited_at')->nullable();
            $table->timestamp('joined_at')->nullable();

            $table->timestamps();

            $table->unique(['vendor_id', 'staff_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_staff');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->rememberToken();
            $table->boolean('is_read')->default(false);
            $table->string('google_access_token')->nullable();
            $table->string('google_refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->timestamps();
            $table->string('stripe_account_id')->nullable();
            $table->boolean('stripe_account_active')->default(false);
            $table->string('google_id')->nullable()->unique();
            $table->string('avatar')->nullable();
            $table->string('given_name')->nullable();
            $table->string('family_name')->nullable();
            $table->string('locale')->nullable();
            $table->string('referral_code')->nullable()->unique();
            $table->foreignId('referred_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('has_received_referral_bonus')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

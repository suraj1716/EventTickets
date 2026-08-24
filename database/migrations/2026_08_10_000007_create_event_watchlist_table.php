<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_watchlist', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();

            $table->string('email');
            // null when a signed-out visitor just leaves an email
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->boolean('notified')->default(false);
            $table->timestamp('notified_at')->nullable();

            $table->timestamps();

            $table->unique(['event_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_watchlist');
    }
};

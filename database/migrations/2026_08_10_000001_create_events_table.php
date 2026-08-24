<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_user_id')->constrained('users')->cascadeOnDelete();

            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            // standalone = single event_leg, tour = multiple legs
            $table->enum('type', ['standalone', 'tour'])->default('standalone');

            // draft: vendor still editing, not visible anywhere
            // proposed: visible on watchlist page, no tickets on sale yet
            // published: live, tickets on sale
            // cancelled: pulled after publishing
            $table->enum('status', ['draft', 'proposed', 'published', 'cancelled'])->default('draft');

            // cultural/language tags for discovery, e.g. ["tamil","punjabi"]
            // deliberately about the EVENT's content, not the organizer's identity
            $table->json('languages')->nullable();

            $table->boolean('watchlist_enabled')->default(true);
            $table->timestamp('published_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};

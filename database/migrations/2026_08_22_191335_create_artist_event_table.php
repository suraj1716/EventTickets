<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artist_event', function (Blueprint $table) {
            $table->foreignId('artist_id')
                ->constrained('artists')
                ->cascadeOnDelete();

            $table->foreignId('event_id')
                ->constrained('events')
                ->cascadeOnDelete();

            $table->primary(['artist_id', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artist_event');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('event_media', function (Blueprint $table) {
        $table->id();

        $table->foreignId('event_id')
            ->constrained('events')
            ->cascadeOnDelete();

        $table->enum('type', ['image', 'video']);

        $table->string('path');

        $table->string('mime_type')->nullable();

        $table->unsignedBigInteger('size')->nullable();

        $table->unsignedInteger('position')->default(0);

        $table->timestamps();

        $table->index(['event_id', 'position']);
    });
}

public function down(): void
{
    Schema::dropIfExists('event_media');
}
};

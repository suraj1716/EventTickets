<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gift_card_templates', function (Blueprint $table) {
            $table->id();
            $table->string('title');                        // e.g. "$50 Gift Card"
            $table->text('description')->nullable();
            $table->decimal('amount', 10, 2);               // face value
            $table->string('image_path')->nullable();       // stored via spatie or simple path
            $table->boolean('active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gift_card_templates');
    }
};

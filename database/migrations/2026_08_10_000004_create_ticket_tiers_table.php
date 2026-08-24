<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_leg_id')->constrained()->cascadeOnDelete();

            $table->string('name'); // "Early bird", "1st lot", "Door price"
            $table->decimal('price', 8, 2);

            $table->unsignedInteger('quantity');   // total allocated for this tier
            $table->unsignedInteger('remaining');  // decremented atomically on purchase

            // date-window pricing: tier is only purchasable within [starts_at, ends_at]
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');

            $table->timestamps();

            $table->index(['event_leg_id', 'starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_tiers');
    }
};

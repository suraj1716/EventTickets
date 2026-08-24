<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->id();

            // Who added it — for attribution only, NOT an access-control
            // gate. Any authenticated Admin|Vendor can select any active
            // venue when building an event; this just tracks provenance.
            $table->foreignId('created_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('name');
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postcode')->nullable();
            $table->string('country')->default('Australia');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->unsignedInteger('capacity')->nullable();

            // Physical property of the room — same enum as event_legs.seating_type.
            $table->string('seating_type')->default('general');

            $table->string('contact_name')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('notes')->nullable();
            $table->string('image_url')->nullable();

            // Soft-disable instead of deleting — past events may still
            // reference this venue via event_legs.venue_id.
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['city', 'is_active']);
            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors', 'user_id')->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('position')->nullable(); // e.g. "Senior Stylist", "Threading Specialist"
            $table->text('bio')->nullable();
            $table->date('hired_date')->nullable();
            $table->string('employment_type')->nullable(); // full-time, part-time, contractor
            $table->json('working_days')->nullable(); // record only — not enforced on bookable slots
            $table->time('working_start_time')->nullable();
            $table->time('working_end_time')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('staff_category', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_category');
        Schema::dropIfExists('staff');
    }
};

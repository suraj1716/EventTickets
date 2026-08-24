<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Customer's preferred staff — null means no preference
            $table->foreignId('preferred_staff_id')
                ->nullable()
                ->constrained('staff')
                ->nullOnDelete();

            // Admin-assigned staff for roster planning
            $table->foreignId('assigned_staff_id')
                ->nullable()
                ->after('preferred_staff_id')
                ->constrained('staff')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['preferred_staff_id']);
            $table->dropForeign(['assigned_staff_id']);
            $table->dropColumn(['preferred_staff_id', 'assigned_staff_id']);
        });
    }
};

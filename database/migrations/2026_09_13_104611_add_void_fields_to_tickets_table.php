<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Mirrors scanned_at/scanned_by — same accountability pattern,
            // for the door-side "void this ticket" action (fraud, refund,
            // chargeback) as distinct from a corrective "undo scan".
            $table->timestamp('voided_at')->nullable()->after('scanned_by');
            $table->foreignId('voided_by')->nullable()->after('voided_at')
                ->constrained('users')->nullOnDelete();
            $table->string('void_reason')->nullable()->after('voided_by');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('voided_by');
            $table->dropColumn(['voided_at', 'void_reason']);
        });
    }
};

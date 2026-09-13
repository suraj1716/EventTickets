<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('refunds', function (Blueprint $table) {
            // A cancelled event that unwinds a resold ticket's full chain
            // (see TicketRefundService::refundResaleChain) now writes one
            // Refund row per hop — the original buyer AND every reseller
            // in between, not just the current owner. ticket_id alone can
            // no longer tell two of those rows apart, so each hop's refund
            // is tagged with the specific resale listing it unwinds (null
            // for the original, non-resale purchase hop). This is also
            // what the idempotency check in refundResaleChain() keys on,
            // so a retried cancellation doesn't double-refund any one hop.
            $table->foreignId('resale_listing_id')->nullable()->after('ticket_id')
                ->constrained('ticket_resale_listings')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('refunds', function (Blueprint $table) {
            $table->dropConstrainedForeignId('resale_listing_id');
        });
    }
};

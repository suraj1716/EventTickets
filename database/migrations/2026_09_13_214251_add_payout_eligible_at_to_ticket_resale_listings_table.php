<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_resale_listings', function (Blueprint $table) {
            // When the seller payout for a sold listing is allowed to fire.
            // Set on completeSale() to the event's date + a short buffer —
            // ProcessResalePayouts (scheduled daily) only pays out listings
            // where seller_paid_out is false AND this has passed. Paying
            // instantly on sale meant a cancelled event left the platform
            // having already sent the reseller their cut with no way to
            // claw it back, on top of having to refund the buyer in full —
            // this closes that gap by making sure no transfer happens
            // until the event has actually taken place.
            $table->timestamp('payout_eligible_at')->nullable()->after('seller_payout_amount');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_resale_listings', function (Blueprint $table) {
            $table->dropColumn('payout_eligible_at');
        });
    }
};

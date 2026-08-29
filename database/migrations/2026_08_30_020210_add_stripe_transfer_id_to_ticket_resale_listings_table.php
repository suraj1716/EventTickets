<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_resale_listings', function (Blueprint $table) {
            $table->string('stripe_transfer_id')->nullable()->after('stripe_payment_intent');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_resale_listings', function (Blueprint $table) {
            $table->dropColumn('stripe_transfer_id');
        });
    }
};

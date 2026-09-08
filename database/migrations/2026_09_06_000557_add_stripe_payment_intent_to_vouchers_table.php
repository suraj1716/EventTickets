<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            // Gift-card-shop purchases now go through the same embedded
            // PaymentIntent flow as the main cart checkout (see
            // VoucherController::purchase()), so vouchers need to be
            // looked up by payment_intent instead of the old Checkout
            // Session id. stripe_session_id is left in place for any
            // vouchers already mid-flow on the old hosted-redirect path.
            $table->string('stripe_payment_intent')->nullable()->after('stripe_session_id');
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn('stripe_payment_intent');
        });
    }
};

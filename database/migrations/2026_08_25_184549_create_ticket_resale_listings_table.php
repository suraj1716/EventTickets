<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_resale_listings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();

            // Snapshot of who was selling and who bought — kept even if
            // ticket ownership later changes again, so this row stays a
            // true record of THIS transaction regardless of what
            // happens to the ticket afterward.
            $table->foreignId('seller_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('buyer_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->decimal('price', 10, 2);
            $table->decimal('commission_pct', 5, 2);
            $table->decimal('commission_amount', 10, 2)->nullable();
            $table->decimal('seller_payout_amount', 10, 2)->nullable();

            // active   = listed, waiting for a buyer
            // sold     = payment confirmed, ticket transferred
            // cancelled = seller pulled the listing before it sold
            $table->enum('status', ['active', 'sold', 'cancelled'])->default('active');

            $table->string('stripe_session_id')->nullable();
            $table->string('stripe_payment_intent')->nullable();

            // Whether the seller has actually been paid out for this
            // sale — separate from `status`, since payment collection
            // (buyer -> platform) and payout (platform -> seller) are
            // two different events, potentially on different rails.
            $table->boolean('seller_paid_out')->default(false);
            $table->timestamp('seller_paid_out_at')->nullable();

            $table->timestamp('sold_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();

            $table->index(['ticket_id', 'status']);

            // NOTE: a ticket can only have ONE active listing at a time —
            // this is enforced in TicketResaleService, not by a DB
            // constraint here. MySQL doesn't support partial/filtered
            // unique indexes (unlike Postgres), so a plain unique index
            // on ticket_id would incorrectly block a ticket from EVER
            // being resold a second time after its first listing is
            // sold/cancelled. The service uses lockForUpdate() + an
            // explicit "does an active listing already exist" check
            // inside a transaction instead — see listTicket() below.
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_resale_listings');
    }
};

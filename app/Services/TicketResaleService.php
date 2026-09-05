<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketResaleListing;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Picqer\Barcode\BarcodeGeneratorPNG;

class TicketResaleService
{
    /**
     * List a ticket for resale. Locks the ticket's code immediately —
     * NOT when it sells — so the seller can't keep using their own QR
     * (or a screenshot of it) at the door while a buyer is shopping.
     */
    public function listTicket(Ticket $ticket, User $seller, float $price): TicketResaleListing
    {
        return DB::transaction(function () use ($ticket, $seller, $price) {
            $ticket = Ticket::where('id', $ticket->id)->lockForUpdate()->firstOrFail();

            // Same check TicketResaleController::store() does before calling
            // in — enforced here too, since this service can be reached
            // directly (jobs, commands, webhooks, admin actions) without
            // going through that controller.
            abort_unless(
                $seller->stripe_account_active,
                422,
                'Set up payouts before listing a ticket — we need somewhere to send your money once it sells.'
            );

            abort_unless($ticket->owner_user_id === $seller->id, 403, 'You do not own this ticket.');
            abort_unless($ticket->status === 'valid', 422, 'Only a valid, unscanned ticket can be listed for resale.');

            // Belt-and-suspenders check, since MySQL can't enforce this
            // with a partial unique index — see the migration's note.
            $alreadyActive = TicketResaleListing::where('ticket_id', $ticket->id)
                ->where('status', 'active')
                ->exists();

            abort_if($alreadyActive, 422, 'This ticket already has an active resale listing.');

            $commissionPct = (float) config('app.resale_commission_pct', 10);

            $listing = TicketResaleListing::create([
                'ticket_id' => $ticket->id,
                'seller_user_id' => $seller->id,
                'price' => $price,
                'commission_pct' => $commissionPct,
                'status' => 'active',
            ]);

            // Locked the instant it's listed — this is the mechanism
            // that stops the seller double-spending their own seat.
            $ticket->update(['status' => 'listed']);

            Log::info('Ticket listed for resale', [
                'ticket_id' => $ticket->id,
                'listing_id' => $listing->id,
                'seller_user_id' => $seller->id,
                'price' => $price,
            ]);

            return $listing;
        });
    }

    /**
     * Seller pulls their own listing before it sells. Ticket goes back
     * to valid and scannable — nothing about ownership changed, so no
     * code rotation needed here.
     */
    public function cancelListing(TicketResaleListing $listing, User $seller): void
    {
        DB::transaction(function () use ($listing, $seller) {
            $listing = TicketResaleListing::where('id', $listing->id)->lockForUpdate()->firstOrFail();

            abort_unless($listing->seller_user_id === $seller->id, 403);
            abort_unless($listing->status === 'active', 422, 'This listing is no longer active.');

            $listing->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

            $listing->ticket()->update(['status' => 'valid']);

            Log::info('Resale listing cancelled', [
                'listing_id' => $listing->id,
                'ticket_id' => $listing->ticket_id,
            ]);
        });
    }

    /**
     * THE core anti-fraud step. Called once payment for a resale is
     * confirmed (from the Stripe webhook, same pattern as gift card
     * fulfillment in StripeController). Everything in this transaction
     * happens atomically, together:
     *
     *   1. ownership moves to the buyer
     *   2. the OLD code is permanently retired — never reused
     *   3. a brand new code + QR + barcode is generated
     *   4. status flips back to valid, under the NEW code only
     *
     * Any screenshot taken before this moment — no matter how many
     * people were sent a copy — now points at a dead code. There is
     * no path to a valid transfer that does not go through here.
     *
     * Seller payout is deliberately NOT inside this transaction — see
     * payoutSeller() below, called right after this returns. An
     * external Stripe API call inside a transaction holding row locks
     * is unsafe, and a payout failure must never roll back a ticket
     * transfer the buyer already paid for.
     */
    public function completeSale(
        TicketResaleListing $listing,
        User $buyer,
        ?string $stripeSessionId = null,
        ?string $stripePaymentIntent = null,
    ): Ticket {
        $ticket = DB::transaction(function () use ($listing, $buyer, $stripeSessionId, $stripePaymentIntent) {
            $listing = TicketResaleListing::where('id', $listing->id)->lockForUpdate()->firstOrFail();

            // Idempotency: webhook retries must not transfer twice.
            if ($listing->status === 'sold') {
                Log::info('Resale listing already sold — skipping duplicate fulfillment', [
                    'listing_id' => $listing->id,
                ]);

                return $listing->ticket()->firstOrFail();
            }

            abort_unless($listing->status === 'active', 422, 'This listing is no longer available.');

            $ticket = Ticket::where('id', $listing->ticket_id)->lockForUpdate()->firstOrFail();

            $commissionAmount = round($listing->price * ($listing->commission_pct / 100), 2);
            $sellerPayout = round($listing->price - $commissionAmount, 2);

            $listing->update([
                'buyer_user_id' => $buyer->id,
                'status' => 'sold',
                'commission_amount' => $commissionAmount,
                'seller_payout_amount' => $sellerPayout,
                'stripe_session_id' => $stripeSessionId,
                'stripe_payment_intent' => $stripePaymentIntent,
                'sold_at' => now(),
            ]);

            $oldCode = $ticket->code;
            $newCode = $this->generateCode();

            $ticket->update([
                'owner_user_id' => $buyer->id,
                'code' => $newCode,
                'status' => 'valid',
                'times_resold' => $ticket->times_resold + 1,
            ]);

            [$qrPath, $barcodePath] = $this->renderCodes($ticket);
            $ticket->update([
                'qr_path' => $qrPath,
                'barcode_path' => $barcodePath,
            ]);

            // Old QR/barcode image files are deliberately left in
            // storage rather than deleted — the code they encode is
            // already dead in the DB (code column changed), and someone
            // may still hold a screenshot referencing the old path for
            // support/dispute purposes. Deleting isn't necessary for
            // security here; the DB row is the only thing that matters.

            Log::info('Ticket resale completed — ownership transferred, code rotated', [
                'ticket_id' => $ticket->id,
                'listing_id' => $listing->id,
                'old_code_retired' => $oldCode,
                'new_owner_user_id' => $buyer->id,
                'seller_payout_amount' => $sellerPayout,
                'commission_amount' => $commissionAmount,
            ]);

            return $ticket->fresh();
        });

        $this->payoutSeller($listing->fresh());

        return $ticket;
    }

    /**
     * Transfers the seller's cut to their connected Stripe account,
     * using the "separate charges and transfers" model — the buyer's
     * payment was collected on the PLATFORM's own Stripe account (see
     * TicketResaleCheckoutController, a plain Checkout Session with no
     * destination account), and this moves the seller's share out of
     * that balance afterward.
     *
     * Deliberately tolerant of failure: a payout failing must never
     * undo the ticket transfer the buyer already paid for. On failure,
     * seller_paid_out stays false and the listing is left for a manual
     * admin retry (see ResaleSellerConnectController — the seller must
     * be onboarded and active before a listing can even be created, so
     * a failure here should be rare/transient rather than "seller has
     * no account at all").
     */
    public function payoutSeller(TicketResaleListing $listing): void
    {
        if ($listing->seller_paid_out || $listing->status !== 'sold') {
            return;
        }

        $seller = $listing->seller;

        if (!$seller || !$seller->stripe_account_id || !$seller->stripe_account_active) {
            Log::error('Resale payout skipped — seller has no active Stripe account', [
                'listing_id' => $listing->id,
                'seller_user_id' => $listing->seller_user_id,
            ]);

            return;
        }

        try {
            \Stripe\Stripe::setApiKey(config('app.stripe_secret_key'));

            $transfer = \Stripe\Transfer::create([
                'amount' => (int) round($listing->seller_payout_amount * 100),
                'currency' => 'aud',
                'destination' => $seller->stripe_account_id,
                'transfer_group' => "resale_listing_{$listing->id}",
                'metadata' => [
                    'ticket_resale_listing_id' => $listing->id,
                ],
            ]);

            $listing->update([
                'seller_paid_out' => true,
                'seller_paid_out_at' => now(),
                'stripe_transfer_id' => $transfer->id,
            ]);

            Log::info('Resale seller payout sent', [
                'listing_id' => $listing->id,
                'stripe_transfer_id' => $transfer->id,
                'amount' => $listing->seller_payout_amount,
            ]);
        } catch (\Exception $e) {
            Log::error('Resale seller payout failed: ' . $e->getMessage(), [
                'listing_id' => $listing->id,
                'seller_user_id' => $listing->seller_user_id,
            ]);
            // Left as seller_paid_out=false for manual retry/admin
            // visibility — not re-thrown, since the ticket transfer
            // itself already succeeded and must not be undone.
        }
    }

    protected function generateCode(): string
    {
        do {
            $code = strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
        } while (Ticket::where('code', $code)->exists());

        return $code;
    }

    protected function renderCodes(Ticket $ticket): array
    {
        $qrPath = "tickets/qr/{$ticket->code}.svg";
        $qrSvg = QrCode::format('svg')->size(300)->generate($ticket->code);
        Storage::disk('public')->put($qrPath, $qrSvg);

        $barcodePath = "tickets/barcode/{$ticket->code}.png";
        $generator = new BarcodeGeneratorPNG();
        $barcodePng = $generator->getBarcode($ticket->code, $generator::TYPE_CODE_128);
        Storage::disk('public')->put($barcodePath, $barcodePng);

        return [$qrPath, $barcodePath];
    }
}

<?php

namespace Database\Seeders;

use App\Models\Ticket;
use App\Models\TicketResaleListing;
use App\Models\User;
use App\Services\TicketResaleService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ResaleSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $this->seedActiveListings();
            $this->seedHistoricalListings();
        });
    }

    /**
     * Create currently-active resale listings using the real
     * TicketResaleService so all resale business rules are respected.
     */
    protected function seedActiveListings(): void
    {
        $service = app(TicketResaleService::class);

        /*
         * Find users who can realistically act as resale sellers.
         * Prefer vendor/customer accounts already created by the
         * project's existing seeders.
         */
        $sellers = User::query()
            ->whereNotNull('email')
            ->where('email', '!=', 'shrestha.suraj.2013@gmail.com')
            ->orderBy('id')
            ->get();

        if ($sellers->isEmpty()) {
            $this->command?->warn(
                'ResaleSeeder: no suitable seller users found; skipped active listings.'
            );

            return;
        }

        /*
         * Only tickets that are currently valid and owned by a user
         * can be listed for resale.
         *
         * Exclude tickets that already have an active listing.
         */
        $tickets = Ticket::query()
            ->where('status', 'valid')
            ->whereNotNull('owner_user_id')
            ->whereDoesntHave('activeResaleListing')
            ->orderBy('id')
            ->limit(3)
            ->get();

        if ($tickets->isEmpty()) {
            $this->command?->warn(
                'ResaleSeeder: no valid unlisted tickets found; skipped active listings.'
            );

            return;
        }

        foreach ($tickets as $ticket) {
            $seller = User::find($ticket->owner_user_id);

            if (!$seller) {
                continue;
            }

            /*
             * Demo resale prices.
             *
             * These are intentionally based around realistic ticket
             * prices rather than modifying the original ticket/order.
             */
            $price = match ($ticket->id % 3) {
                0 => 145.00,
                1 => 175.00,
                default => 220.00,
            };

            /*
             * listTicket() handles:
             *
             * - ownership validation
             * - valid ticket validation
             * - duplicate active listing prevention
             * - commission percentage
             * - listing creation
             * - changing ticket status to "listed"
             */
            try {
                $listing = $service->listTicket(
                    $ticket,
                    $seller,
                    $price
                );

                $this->command?->info(
                    "ResaleSeeder: active listing #{$listing->id} created for ticket #{$ticket->id}."
                );
            } catch (\Throwable $e) {
                $this->command?->warn(
                    "ResaleSeeder: could not list ticket #{$ticket->id}: {$e->getMessage()}"
                );
            }
        }
    }

    /**
     * Create historical cancelled/sold listings.
     *
     * These are intentionally inserted directly because calling
     * TicketResaleService::completeSale() would execute the real
     * Stripe payout workflow during database seeding.
     */
    protected function seedHistoricalListings(): void
    {
        /*
         * Cancelled listings can safely reference valid tickets.
         */
        $cancelledTicket = Ticket::query()
            ->where('status', 'valid')
            ->whereNotNull('owner_user_id')
            ->whereDoesntHave('resaleListings', function ($query) {
                $query->where('status', 'active');
            })
            ->orderBy('id')
            ->first();

        if ($cancelledTicket) {
            $sellerId = $cancelledTicket->owner_user_id;

            $existing = TicketResaleListing::query()
                ->where('ticket_id', $cancelledTicket->id)
                ->where('status', 'cancelled')
                ->exists();

            if (!$existing) {
                TicketResaleListing::create([
                    'ticket_id' => $cancelledTicket->id,
                    'seller_user_id' => $sellerId,
                    'buyer_user_id' => null,
                    'price' => 135.00,
                    'commission_pct' => (float) config('app.resale_commission_pct', 10),
                    'commission_amount' => null,
                    'seller_payout_amount' => null,
                    'status' => 'cancelled',
                    'stripe_session_id' => null,
                    'stripe_payment_intent' => null,
                    'seller_paid_out' => false,
                    'seller_paid_out_at' => null,
                    'sold_at' => null,
                    'cancelled_at' => now()->subDays(3),
                ]);

                $this->command?->info(
                    "ResaleSeeder: historical cancelled listing created for ticket #{$cancelledTicket->id}."
                );
            }
        }

        /*
         * Historical sold listing.
         *
         * We deliberately do NOT use completeSale() here because that
         * method performs ticket-code rotation and attempts a Stripe
         * seller payout.
         */
        $soldTicket = Ticket::query()
            ->where('status', 'valid')
            ->whereNotNull('owner_user_id')
            ->whereDoesntHave('activeResaleListing')
            ->orderByDesc('id')
            ->first();

        if (!$soldTicket) {
            return;
        }

        /*
         * Seller is the current owner for this demo historical record.
         * Buyer is another existing user.
         */
        $seller = User::find($soldTicket->owner_user_id);

        $buyer = User::query()
            ->where('id', '!=', $soldTicket->owner_user_id)
            ->orderBy('id')
            ->first();

        if (!$seller || !$buyer) {
            return;
        }

        $price = 190.00;
        $commissionPct = (float) config('app.resale_commission_pct', 10);
        $commissionAmount = round($price * ($commissionPct / 100), 2);
        $sellerPayout = round($price - $commissionAmount, 2);

        $existingSold = TicketResaleListing::query()
            ->where('ticket_id', $soldTicket->id)
            ->where('status', 'sold')
            ->exists();

        if ($existingSold) {
            return;
        }

        TicketResaleListing::create([
            'ticket_id' => $soldTicket->id,
            'seller_user_id' => $seller->id,
            'buyer_user_id' => $buyer->id,
            'price' => $price,
            'commission_pct' => $commissionPct,
            'commission_amount' => $commissionAmount,
            'seller_payout_amount' => $sellerPayout,
            'status' => 'sold',
            'stripe_session_id' => 'seed_resale_session_' . $soldTicket->id,
            'stripe_payment_intent' => 'seed_resale_payment_' . $soldTicket->id,
            'seller_paid_out' => false,
            'seller_paid_out_at' => null,
            'sold_at' => now()->subDays(7),
            'cancelled_at' => null,
        ]);

        /*
         * This ticket represents a completed historical resale.
         *
         * We update ownership/status/times_resold but intentionally
         * don't rotate the code or generate Stripe/payment artifacts.
         */
        $soldTicket->update([
            'owner_user_id' => $buyer->id,
            'status' => 'valid',
            'times_resold' => ((int) $soldTicket->times_resold) + 1,
        ]);

        $this->command?->info(
            "ResaleSeeder: historical sold listing created for ticket #{$soldTicket->id}."
        );
    }
}

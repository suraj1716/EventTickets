<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EventWatchlistSeeder extends Seeder
{
    public function run(): void
    {
        $customers = DB::table('users')
            ->whereIn('email', [
                'emma@example.com',
                'sophia@example.com',
                'olivia@example.com',
                'ava@example.com',
                'isabella@example.com',
            ])
            ->get();

        if ($customers->isEmpty()) {
            $this->command->warn('No customer users found. Run CustomerSeeder first.');
            return;
        }

        $events = DB::table('events')
            ->whereNull('deleted_at')
            ->where('watchlist_enabled', true)
            ->orderBy('id')
            ->get();

        if ($events->isEmpty()) {
            $this->command->warn('No events with watchlist_enabled=true found.');
            return;
        }

        $created = 0;
        $updated = 0;

        foreach ($events as $eventIndex => $event) {
            // Spread customers across events so every enabled event
            // gets several realistic watchlist entries.
            $customerCount = min($customers->count(), 3 + ($eventIndex % 3));

            $selectedCustomers = $customers->take($customerCount);

            foreach ($selectedCustomers as $customerIndex => $customer) {
                $notified = (($eventIndex + $customerIndex) % 4 === 0);

                $createdAt = now()->subDays(
                    max(1, (($eventIndex + 1) * 2) + $customerIndex)
                );

                $data = [
                    'user_id'      => $customer->id,
                    'notified'     => $notified,
                    'notified_at' => $notified
                        ? (clone $createdAt)->addDays(1)
                        : null,
                    'updated_at'   => now(),
                ];

                $existing = DB::table('event_watchlist')
                    ->where('event_id', $event->id)
                    ->where('email', $customer->email)
                    ->first();

                if ($existing) {
                    DB::table('event_watchlist')
                        ->where('id', $existing->id)
                        ->update($data);

                    $updated++;
                } else {
                    DB::table('event_watchlist')->insert([
                        'event_id'     => $event->id,
                        'email'        => $customer->email,
                        'user_id'      => $customer->id,
                        'notified'     => $notified,
                        'notified_at'  => $notified
                            ? (clone $createdAt)->addDays(1)
                            : null,
                        'created_at'   => $createdAt,
                        'updated_at'   => now(),
                    ]);

                    $created++;
                }
            }
        }

        $total = DB::table('event_watchlist')->count();

        $this->command->info("EventWatchlistSeeder complete: {$created} created, {$updated} updated, {$total} total watchlist entries.");
    }
}

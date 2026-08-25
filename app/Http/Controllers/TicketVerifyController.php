<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketVerifyController extends Controller
{
    // Public landing page — no login required. This is what a buyer
    // checks BEFORE paying a stranger off-platform, per the whole
    // point of this feature: catch the scam before money changes
    // hands, not after.
    public function index()
    {
        return Inertia::render('Resale/Verify');
    }

    // Looks a code up and returns ONLY status information — never the
    // owner's name, email, or any other personal detail. Enough for a
    // buyer to know "is this safe to pay for", nothing that could be
    // scraped to build a list of real attendees.
    public function check(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:64'],
        ]);

        $ticket = Ticket::with(['eventLeg.event', 'ticketTier'])
            ->where('code', $data['code'])
            ->first();

        if (!$ticket) {
            return response()->json([
                'status' => 'not_found',
                'message' => 'No ticket matches this code. Do not pay — this code is not valid.',
            ]);
        }

        $payload = [
            'event_name' => $ticket->eventLeg?->event?->name,
            'venue_name' => $ticket->eventLeg?->venue_name,
            'event_date' => $ticket->eventLeg?->event_date,
            'tier_name' => $ticket->ticketTier?->name,
        ];

        return match ($ticket->status) {
            'valid' => response()->json([
                'status' => $ticket->neverResold() ? 'verified_original' : 'verified_resold',
                'message' => $ticket->neverResold()
                    ? 'This ticket is valid and has never been resold.'
                    : 'This ticket is valid. It has been resold before through this platform — that is normal and does not affect its validity.',
                ...$payload,
            ]),

            'listed' => response()->json([
                'status' => 'listed_for_resale',
                'message' => 'This ticket is currently listed for resale on this platform. If someone is selling it to you privately instead, do not pay — buy it through the listing here instead.',
                ...$payload,
            ]),

            'used' => response()->json([
                'status' => 'already_used',
                'message' => 'This ticket has already been scanned at the event. Do not pay for it.',
                ...$payload,
            ]),

            'void' => response()->json([
                'status' => 'void',
                'message' => 'This ticket has been voided and is not valid. Do not pay for it.',
                ...$payload,
            ]),

            default => response()->json([
                'status' => 'unknown',
                'message' => 'Could not determine this ticket\'s status.',
            ]),
        };
    }
}

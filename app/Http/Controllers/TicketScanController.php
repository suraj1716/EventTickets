<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketScanController extends Controller
{
    // Renders the scanner page itself. 'Staff/Scan' doesn't exist as a
    // .tsx yet — this just gets the door staff to a page to scan from.
    public function index()
    {
        return Inertia::render('Staff/Scan');
    }

    // Handles a submitted code. Re-renders the same scan page with the
    // result as a prop rather than redirecting — staff want to see the
    // outcome of THIS scan immediately and then scan the next ticket,
    // not bounce through a redirect. Same idempotent-safe behavior as
    // the JSON version: an already-used or void ticket comes back as a
    // normal result, not an error page.
    public function scan(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string'],
        ]);

        $ticket = Ticket::with(['ticketTier', 'eventLeg.event'])
            ->where('code', $data['code'])
            ->first();

        if (! $ticket) {
            return Inertia::render('Staff/Scan', [
                'result' => ['status' => 'not_found', 'code' => $data['code']],
            ]);
        }

        // Route middleware only checks the role:Admin|Vendor — it says
        // nothing about WHICH vendor's tickets this Vendor may scan.
        // Without this, any Vendor account could scan/void a ticket for
        // an event they don't own.
        if (! $request->user()->hasRole('Admin')) {
            abort_unless(
                $ticket->eventLeg?->event?->vendor_user_id === $request->user()->id,
                403,
                'This ticket belongs to a different event.'
            );
        }

        if ($ticket->status === 'void') {
            return Inertia::render('Staff/Scan', [
                'result' => ['status' => 'void', 'ticket' => $ticket],
            ]);
        }

        if ($ticket->status === 'used') {
            return Inertia::render('Staff/Scan', [
                'result' => [
                    'status' => 'already_scanned',
                    'scanned_at' => $ticket->scanned_at,
                    'ticket' => $ticket,
                ],
            ]);
        }

        $ticket->markScanned($request->user()?->id);

        return Inertia::render('Staff/Scan', [
            'result' => ['status' => 'ok', 'ticket' => $ticket->fresh(['ticketTier', 'eventLeg.event'])],
        ]);
    }
}

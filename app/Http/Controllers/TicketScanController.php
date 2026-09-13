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

        // Route middleware only checks account_type:Admin|Vendor|Staff — it
        // says nothing about WHICH vendor's tickets this account may scan.
        // Without this, any Vendor/Staff account could scan/void a ticket
        // for an event they don't act for. actingVendorId() covers both:
        // a Vendor's own id, or a Staff member's currently-acting vendor.
        if (! $request->user()->isAdmin()) {
            abort_unless(
                $ticket->eventLeg?->event?->vendor_user_id === $request->user()->actingVendorId(),
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

        // A ticket up for resale keeps its ORIGINAL code active until it
        // actually sells (code only rotates in
        // TicketResaleService::completeSale()) — so without this check,
        // the current holder could walk up and scan a ticket they've
        // simultaneously listed for sale, and it would read as a normal
        // 'ok' entry. That's misleading for staff either way: if it
        // later sells, this same code becomes dead and a *different*
        // person shows up with the new one; if it never sells, this was
        // fine all along but staff had no way to tell the difference at
        // the door. Surface it explicitly instead of silently admitting.
        if ($ticket->status === 'listed') {
            return Inertia::render('Staff/Scan', [
                'result' => ['status' => 'listed_for_resale', 'ticket' => $ticket],
            ]);
        }

        $ticket->markScanned($request->user()?->id);

        return Inertia::render('Staff/Scan', [
            'result' => ['status' => 'ok', 'ticket' => $ticket->fresh(['ticketTier', 'eventLeg.event'])],
        ]);
    }
}

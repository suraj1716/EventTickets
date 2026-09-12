<?php

namespace App\Http\Controllers;

use App\Mail\TicketsIssuedMail;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TicketTier;
use App\Services\TicketGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DoorSaleController extends Controller
{
 public function create(Request $request)
{
    $vendorUserId = $this->getVendorUserId($request);

    $events = Event::where('vendor_user_id', $vendorUserId)
        ->where('status', 'published')
        ->with([
    'legs.ticketTiers',
    'legs.seats',
])
        ->orderBy('name')
        ->get();

    return Inertia::render('Staff/DoorSale', [
        'events' => $events,
    ]);
}

 public function store(Request $request)
{
    $vendorUserId = $this->getVendorUserId($request);

    $data = $request->validate([
        'event_id' => ['required', 'integer', 'exists:events,id'],
        'buyer_name' => ['required', 'string', 'max:255'],
        'buyer_email' => ['required', 'email', 'max:255'],
        'lines' => ['required', 'array', 'min:1'],
        'lines.*.ticket_tier_id' => ['required', 'integer', 'exists:ticket_tiers,id'],
        'lines.*.quantity' => ['required', 'integer', 'min:1'],
    ]);

    $event = Event::where('id', $data['event_id'])
        ->where('vendor_user_id', $vendorUserId)
        ->where('status', 'published')
        ->firstOrFail();

    // ... existing order creation
}


// Resolves via VendorStaff/actingVendorId() — the same mechanism the
// rest of the app uses (SetPermissionsTeam, EventPolicy, etc) — not the
// separate legacy `staff` table, which has nothing to do with vendor
// team membership and would silently 404 real staff accounts here.
//
// Admin has no vendor context of its own and isn't handled: door sales
// don't have a vendor-picker for Admin yet (unlike VendorStaffController's
// targetVendorId()). Add one before enabling this for Admin use.
private function getVendorUserId(Request $request): int
{
    $vendorId = $request->user()->actingVendorId();

    abort_unless($vendorId, 403, 'No vendor context for this account.');

    return $vendorId;
}

}

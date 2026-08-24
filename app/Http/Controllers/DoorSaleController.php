<?php

namespace App\Http\Controllers;

use App\Mail\TicketsIssuedMail;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Staff;
use App\Models\TicketTier;
use App\Models\User;
use App\Services\TicketGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DoorSaleController extends Controller
{
    private function getStaffForUser(Request $request): Staff
    {
        return Staff::where('email', $request->user()->email)
            ->where('is_active', true)
            ->firstOrFail();
    }

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
     dd($request->all());
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


private function getVendorUserId(Request $request): int
{
    $user = $request->user();

    if ($user->hasRole('Admin') || $user->hasRole('Vendor')) {
        return $user->id;
    }

    $staff = Staff::where('email', $user->email)
        ->where('is_active', true)
        ->firstOrFail();

    return $staff->vendor_id;
}

}

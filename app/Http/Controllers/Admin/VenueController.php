<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VenueController extends Controller
{
    public function index(Request $request)
    {
        $venues = Venue::query()
            ->visibleTo($request->user())
            ->withCount('eventLegs')
            ->when(
                $request->filled('search'),
                fn ($q) => $q->where('name', 'like', '%' . $request->input('search') . '%')
            )
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Venue $venue) => [
                ...$venue->toArray(),
                'can' => ['manage' => $this->canManage($request, $venue)],
            ]);

        return Inertia::render('Admin/Venues/Index', [
            'venues' => $venues,
            'filters' => $request->only('search'),
            'can' => ['create' => $this->canCreate($request)],
        ]);
    }

    public function create(Request $request)
    {
        $this->authorizeCreate($request);

        return Inertia::render('Admin/Venues/Form');
    }

    public function store(Request $request)
    {
        $this->authorizeCreate($request);

        $data = $this->validateVenue($request);

        $venue = Venue::create([
            ...$data,
            // A Vendor creates it as themselves; an Admin creates it as
            // themselves (a platform-owned venue, visible to everyone —
            // see Venue::scopeVisibleTo()). Staff can never reach this
            // point at all — see authorizeCreate() — so there's no
            // "Staff acting for a vendor" case to account for here.
            'created_by_user_id' => $request->user()->id,
        ]);

        return redirect()
            ->route('admin.venues.edit', $venue)
            ->with('success', "Venue \"{$venue->name}\" saved.");
    }

    public function edit(Request $request, Venue $venue)
    {
        abort_unless(
            Venue::visibleTo($request->user())->whereKey($venue->id)->exists(),
            404
        );

        return Inertia::render('Admin/Venues/Form', [
            'venue' => $venue,
            'can' => ['manage' => $this->canManage($request, $venue)],
        ]);
    }

    public function update(Request $request, Venue $venue)
    {
        $this->authorizeManage($request, $venue);

        $venue->update($this->validateVenue($request));

        return redirect()->back()->with('success', 'Venue updated.');
    }

    public function destroy(Request $request, Venue $venue)
    {
        $this->authorizeManage($request, $venue);

        if ($venue->eventLegs()->exists()) {
            return redirect()->back()->withErrors([
                'venue' => 'This venue is used by at least one event and can\'t be deleted. Deactivate it instead.',
            ]);
        }

        $venue->delete();

        return redirect()->back()->with('success', 'Venue deleted.');
    }

    protected function validateVenue(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:100'],
            'postcode' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'seating_type' => ['required', 'in:general,reserved'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    /**
     * Who's allowed to create a new venue at all: an Admin, or a true
     * Vendor. Staff are deliberately excluded — even though Staff can act
     * on a vendor's behalf for most things (selecting a venue, managing
     * an event), adding new venues to the catalogue is reserved for the
     * vendor owner or Admin.
     */
    protected function canCreate(Request $request): bool
    {
        $user = $request->user();

        return $user->isAdmin() || $user->isVendorRole();
    }

    protected function authorizeCreate(Request $request): void
    {
        abort_unless(
            $this->canCreate($request),
            403,
            'Only a Vendor or an Admin can create a venue.'
        );
    }

    /**
     * Editing/deleting an existing entry is restricted to whoever's vendor
     * TEAM added it, or an Admin — otherwise any vendor (or their staff)
     * could rename or delete a venue that other vendors' events already
     * point to. Visibility (who can *see* and *select* a venue at all) is
     * a separate, stricter rule — see Venue::scopeVisibleTo().
     *
     * Compares against actingVendorId(), not the raw user id — a Staff
     * member acting for the vendor that owns this venue must pass the
     * same check the vendor owner would.
     */
    protected function canManage(Request $request, Venue $venue): bool
    {
        $user = $request->user();

        return $user->isAdmin() || $venue->created_by_user_id === $user->actingVendorId();
    }

    protected function authorizeManage(Request $request, Venue $venue): void
    {
        abort_unless(
            $this->canManage($request, $venue),
            403,
            'Only the venue\'s creator or an Admin can edit or delete it.'
        );
    }
}

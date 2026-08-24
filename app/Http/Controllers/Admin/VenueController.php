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
            ->withCount('eventLegs')
            ->when(
                $request->filled('search'),
                fn ($q) => $q->where('name', 'like', '%' . $request->input('search') . '%')
            )
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Venues/Index', [
            'venues' => $venues,
            'filters' => $request->only('search'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Venues/Form');
    }

    public function store(Request $request)
    {
        $data = $this->validateVenue($request);

        $venue = Venue::create([
            ...$data,
            'created_by_user_id' => $request->user()->id,
        ]);

        return redirect()
            ->route('admin.venues.edit', $venue)
            ->with('success', "Venue \"{$venue->name}\" saved.");
    }

    public function edit(Venue $venue)
    {
        return Inertia::render('Admin/Venues/Form', [
            'venue' => $venue,
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
     * Anyone can create and anyone can select. Editing/deleting an
     * existing entry is restricted to whoever added it, or an Admin —
     * otherwise any vendor could rename or delete a venue that other
     * vendors' events already point to.
     */
    protected function authorizeManage(Request $request, Venue $venue): void
    {
        abort_unless(
            $request->user()->hasRole('Admin') || $venue->created_by_user_id === $request->user()->id,
            403,
            'Only the venue\'s creator or an Admin can edit or delete it.'
        );
    }
}

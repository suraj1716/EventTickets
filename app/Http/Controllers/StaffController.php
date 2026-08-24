<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    // ── Vendor admin CRUD (scoped to logged-in vendor only) ──────

    public function index(Request $request)
    {
        // dd(Auth::user()->hasAnyRole(['Admin', 'Vendor']));
        $staff = Staff::forVendor(Auth::id())
            ->with('categories')
            ->when($request->search, fn($q, $search) => $q->where(function ($q2) use ($search) {
                $q2->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $staff->getCollection()->transform(fn($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'email' => $s->email,
            'phone' => $s->phone,
            'position' => $s->position,
            'employment_type' => $s->employment_type,
            'is_active' => (bool) $s->is_active,
            'photo_url' => $s->getFirstMediaUrl('photo'),
            'category_ids' => $s->categories->pluck('id'),
            'created_at' => $s->created_at?->format('Y-m-d'),
        ]);

        return Inertia::render('Admin/Staffs/Index', [
            'staff' => $staff,
            'filters' => $request->only('search'),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateStaff($request);

        $staff = Staff::create([
            ...collect($validated)->except(['category_ids', 'photo'])->toArray(),
            'vendor_id' => Auth::id(),
        ]);

        $staff->categories()->sync($validated['category_ids'] ?? []);

        if ($request->hasFile('photo')) {
            $staff->addMediaFromRequest('photo')->toMediaCollection('photo');
        }

        return redirect()->route('admin.vendor.staff.index')->with('success', 'Staff member added.');
    }

    public function update(Request $request, Staff $staff)
    {
        $this->authorizeStaffOwnership($staff);

        $validated = $this->validateStaff($request);

        $staff->update(collect($validated)->except(['category_ids', 'photo'])->toArray());
        $staff->categories()->sync($validated['category_ids'] ?? []);

        if ($request->hasFile('photo')) {
            $staff->addMediaFromRequest('photo')->toMediaCollection('photo');
        }

        return redirect()->route('admin.vendor.staff.index')->with('success', 'Staff member updated.');
    }

    public function destroy(Staff $staff)
    {
        $this->authorizeStaffOwnership($staff);
        $staff->delete();

        return back()->with('success', 'Staff member removed.');
    }

    // ── Public endpoint used by the checkout staff-selection step ──

    public function forBooking(Request $request)
    {
        $request->validate([
            'vendor_id'   => 'required|exists:vendors,user_id',
            'category_id' => 'nullable|exists:categories,id',
            'date'        => 'nullable|date',
            'time_slot'   => 'nullable|string',
        ]);

        $staff = Staff::forVendor($request->vendor_id)
            ->active()
            ->when($request->category_id, fn($q) => $q->whereHas(
                'categories',
                fn($q2) => $q2->where('categories.id', $request->category_id)
            ))
            ->get();

        // Only check booking conflicts if a date+time has actually been chosen
        $bookedStaffIds = [];
        if ($request->date && $request->time_slot) {
            $formattedDate = \Carbon\Carbon::parse($request->date)->format('Y-m-d');
            $normalizedSlot = strtolower(trim($request->time_slot));

            $bookedStaffIds = DB::table('bookings')
                ->whereDate('booking_date', $formattedDate)
                ->whereRaw('LOWER(TRIM(time_slot)) = ?', [$normalizedSlot])
                ->whereNotNull('staff_id')
                ->pluck('staff_id')
                ->toArray();
        }

        $result = $staff->map(fn($s) => [
            'id'        => $s->id,
            'name'      => $s->name,
            'position'  => $s->position,
            'photo_url' => $s->getFirstMediaUrl('photo'),
            'available' => !in_array($s->id, $bookedStaffIds),
        ]);

        return response()->json($result);
    }

    // ── Shared helpers ───────────────────────────────────────

    private function validateStaff(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
            'hired_date' => 'nullable|date',
            'employment_type' => 'nullable|string|max:50',
            'working_days' => 'nullable|array',
            'working_start_time' => 'nullable|date_format:H:i',
            'working_end_time' => 'nullable|date_format:H:i',
            'is_active' => 'boolean',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer|exists:categories,id',
            'photo' => 'nullable|image|max:5120',
        ]);
    }

    private function authorizeStaffOwnership(Staff $staff): void
    {
        abort_unless($staff->vendor_id === Auth::id(), 403);
    }
}

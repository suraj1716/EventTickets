<?php

namespace App\Http\Controllers\Admin;

use App\Enums\RolesEnum;
use App\Http\Controllers\Controller;
use App\Enums\VendorStatusEnum;
use App\Mail\StaffInvitation;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorStaff;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class VendorStaffController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): Response
    {
        $user = $request->user();
        $vendorId = $this->targetVendorId($request, required: false);

        $this->authorize('viewAny', VendorStaff::class);

        $team = $vendorId
            ? VendorStaff::forVendor($vendorId)
                ->with('staff:id,name,email,phone,avatar')
                ->latest()
                ->get()
                ->map(fn (VendorStaff $vs) => [
                    'id' => $vs->id,
                    'name' => $vs->staff->name,
                    'email' => $vs->staff->email,
                    'phone' => $vs->staff->phone,
                    'photo' => $vs->staff->avatar,
                    'status' => $vs->status,
                    'invited_at' => $vs->invited_at?->format('Y-m-d'),
                    'joined_at' => $vs->joined_at?->format('Y-m-d'),
                ])
            : collect();

        return Inertia::render('Admin/Team/Index', [
            'team' => $team,
            'vendorId' => $vendorId,
            // Admin has no "acting" vendor of their own, so the page must
            // let them pick one before a list can be shown.
            'requiresVendorSelection' => $user->isAdmin() && ! $vendorId,
            // Admin has no vendor of their own to default to, so they
            // pick one from the full list of approved vendors.
            'vendors' => $user->isAdmin()
                ? Vendor::where('status', VendorStatusEnum::Approved->value)
                    ->with('user:id,name')
                    ->get(['user_id', 'store_name'])
                : null,
        ]);
    }

    public function store(Request $request)
    {
        $vendorId = $this->targetVendorId($request, required: true);

        $this->authorize('create', [VendorStaff::class, $vendorId]);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:30',
            'photo' => 'nullable|image|max:2048',
        ]);

        $targetUser = User::where('email', $validated['email'])->first();

        if ($targetUser && $this->hasAdminOrVendorRole($targetUser)) {
            return back()->withErrors([
                'email' => 'This person already has an Admin or Vendor account and can\'t be invited as staff.',
            ]);
        }

        $justCreated = false;

        // phone/photo only apply when we're creating the account — we
        // won't silently overwrite an existing user's own profile info
        // just because someone invited them.
        if (! $targetUser) {
            $targetUser = User::create([
                'name' => $validated['name'] ?? $validated['email'],
                'email' => $validated['email'],
                'password' => null,
                'phone' => $validated['phone'] ?? null,
                'avatar' => $request->hasFile('photo')
                    ? Storage::disk('public')->url($request->file('photo')->store('staff-avatars', 'public'))
                    : null,
            ]);
            $justCreated = true;
        }

        $vendorStaff = VendorStaff::where('vendor_id', $vendorId)
            ->where('staff_id', $targetUser->id)
            ->first();

        if ($vendorStaff?->isActive()) {
            return back()->withErrors(['email' => 'This person is already an active member of this team.']);
        }

        $vendorStaff = VendorStaff::updateOrCreate(
            ['vendor_id' => $vendorId, 'staff_id' => $targetUser->id],
            ['status' => 'invited', 'invited_at' => now()]
        );

        $this->sendInvitation($vendorStaff, $targetUser, $justCreated);

        return back()->with('success', 'Invitation sent.');
    }

    public function resend(VendorStaff $vendorStaff)
    {
        $this->authorize('update', $vendorStaff);

        abort_unless($vendorStaff->isInvited(), 422, 'Only pending invitations can be resent.');

        $vendorStaff->update(['invited_at' => now()]);

        $this->sendInvitation($vendorStaff, $vendorStaff->staff, is_null($vendorStaff->staff->password));

        return back()->with('success', 'Invitation resent.');
    }

    public function suspend(VendorStaff $vendorStaff)
    {
        $this->authorize('update', $vendorStaff);

        abort_unless($vendorStaff->isActive(), 422, 'Only active members can be suspended.');

        // Only strip the Staff role if this was their last active vendor
        // — the role is global, not per-vendor, so a staff member working
        // for two vendors should keep it while suspended from just one.
        if ($vendorStaff->staff->activeVendors()->where('users.id', '!=', $vendorStaff->vendor_id)->doesntExist()) {
            $vendorStaff->staff->removeRole(RolesEnum::Staff->value);
        }

        $vendorStaff->update(['status' => 'suspended']);

        return back()->with('success', 'Team member suspended.');
    }

    public function reactivate(VendorStaff $vendorStaff)
    {
        $this->authorize('update', $vendorStaff);

        abort_unless($vendorStaff->status === 'suspended', 422, 'Only suspended members can be reactivated.');

        if (! $vendorStaff->staff->hasRole(RolesEnum::Staff->value)) {
            $vendorStaff->staff->assignRole(RolesEnum::Staff->value);
        }

        $vendorStaff->update(['status' => 'active']);

        return back()->with('success', 'Team member reactivated.');
    }

    public function destroy(VendorStaff $vendorStaff)
    {
        $this->authorize('delete', $vendorStaff);

        if ($vendorStaff->isActive()
            && $vendorStaff->staff->activeVendors()->where('users.id', '!=', $vendorStaff->vendor_id)->doesntExist()
        ) {
            $vendorStaff->staff->removeRole(RolesEnum::Staff->value);
        }

        $vendorStaff->delete();

        return back()->with('success', 'Team member removed.');
    }

    // ── Helpers ───────────────────────────────────────────────

    /**
     * Which vendor's team this request is acting on. Vendors always act
     * on their own team; Admin must say which vendor explicitly since
     * they don't have one of their own.
     */
    private function targetVendorId(Request $request, bool $required): ?int
    {
        $user = $request->user();

        if (! $user->isAdmin()) {
            return $user->actingVendorId();
        }

        $rule = $required ? 'required' : 'nullable';
return $request->validate([
    'vendor_id' => [
        $rule,
        'integer',
        'exists:vendors,user_id',
        function ($attribute, $value, $fail) {
            $vendor = Vendor::where('user_id', $value)->first();

            if (! $vendor || $vendor->status !== VendorStatusEnum::Approved->value) {
                $fail('The selected vendor is not approved.');
            }
        },
    ],
])['vendor_id'] ?? null;

        }

    private function hasAdminOrVendorRole(User $user): bool
    {
        return $user->hasAnyRole([RolesEnum::Admin->value, RolesEnum::Vendor->value]);
    }

    private function sendInvitation(VendorStaff $vendorStaff, User $targetUser, bool $needsPassword): void
    {
        $acceptUrl = URL::temporarySignedRoute(
            'staff-invite.accept',
            now()->addDays(7),
            ['vendorStaff' => $vendorStaff->id, 'new' => $needsPassword ? 1 : 0]
        );

        Mail::to($targetUser->email)->send(new StaffInvitation($vendorStaff, $acceptUrl, $needsPassword));
    }
}

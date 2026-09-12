<?php

namespace App\Http\Controllers;

use App\Enums\RolesEnum;
use App\Models\VendorStaff;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Both routes here sit behind the 'signed' middleware and are guest-
 * accessible (a brand-new staff account isn't logged in yet). See
 * routes/web.php.
 */
class StaffInviteAcceptController extends Controller
{
    public function show(Request $request, VendorStaff $vendorStaff): Response
    {
        if (! $vendorStaff->isInvited()) {
            return Inertia::render('Auth/StaffInviteAccept', [
                'invalid' => true,
                'message' => $vendorStaff->isActive()
                    ? 'This invitation has already been accepted.'
                    : 'This invitation is no longer valid.',
            ]);
        }

        $loggedInAsSomeoneElse = Auth::check() && Auth::id() !== $vendorStaff->staff_id;

        return Inertia::render('Auth/StaffInviteAccept', [
            'invalid' => false,
            'vendorName' => $vendorStaff->vendor->vendor->store_name,
            'staffName' => $vendorStaff->staff->name,
            'staffEmail' => $vendorStaff->staff->email,
            'needsPassword' => $request->boolean('new') && is_null($vendorStaff->staff->password),
            'loggedInAsSomeoneElse' => $loggedInAsSomeoneElse,
            'acceptUrl' => $request->fullUrl(),
        ]);
    }

    public function store(Request $request, VendorStaff $vendorStaff)
    {
        abort_unless($vendorStaff->isInvited(), 422, 'This invitation is no longer valid.');

        if (Auth::check() && Auth::id() !== $vendorStaff->staff_id) {
            return back()->withErrors([
                'email' => 'You\'re logged in as a different account. Log out first, then reopen the invitation link.',
            ]);
        }

        $needsPassword = $request->boolean('new') && is_null($vendorStaff->staff->password);

        if ($needsPassword) {
            Validator::make($request->all(), [
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ])->validate();
        }

        DB::transaction(function () use ($request, $vendorStaff, $needsPassword) {
            $staff = $vendorStaff->staff;

            if ($needsPassword) {
                $staff->forceFill([
                    'password' => Hash::make($request->input('password')),
                    'email_verified_at' => $staff->email_verified_at ?? now(),
                ])->save();
            }

            $vendorStaff->update(['status' => 'active', 'joined_at' => now()]);

            // Staff is a global role — which vendor(s) they can act as is
            // tracked entirely by vendor_staff, not by the role itself.
            if (! $staff->hasRole(RolesEnum::Staff->value)) {
                $staff->assignRole(RolesEnum::Staff->value);
            }

            if (! Auth::check()) {
                if ($needsPassword) {
                    event(new Registered($staff));
                }
                Auth::login($staff);
            }

            $request->session()->put('acting_vendor_id', $vendorStaff->vendor_id);
        });

        return redirect()->route('admin.dashboard')->with('success', 'Welcome to the team!');
    }
}

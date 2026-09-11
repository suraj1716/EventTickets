<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SwitchVendorController extends Controller
{
    /**
     * Standalone page listing the vendors this staff member can act as —
     * also embedded inline in the Permissions Test page, but useful as
     * its own screen too.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $vendors = $user->isStaffRole()
            ? $user->activeVendors()->get(['users.id', 'users.name', 'users.email'])
            : collect();

        return Inertia::render('Admin/SwitchVendor/Index', [
            'vendors' => $vendors,
            'activeVendorId' => session('acting_vendor_id'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'vendor_id' => ['required', 'integer'],
        ]);

        $user = $request->user();

        abort_unless(
            $user->isStaffRole()
                && $user->activeVendors()->where('users.id', $request->integer('vendor_id'))->exists(),
            403,
            "You don't have active access to that vendor."
        );

        $request->session()->put('acting_vendor_id', $request->integer('vendor_id'));

        return back()->with('status', 'Switched vendor context.');
    }
}

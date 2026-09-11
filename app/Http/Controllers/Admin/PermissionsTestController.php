<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PermissionsTestController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $actingVendorId = $user->actingVendorId();

        // An event owned by whichever vendor this user is currently
        // acting as (if any exist).
        $ownEvent = $actingVendorId
            ? Event::where('vendor_user_id', $actingVendorId)->first(['id', 'name', 'vendor_user_id'])
            : null;

        // An event owned by a DIFFERENT vendor — this is the one that
        // should always come back denied for Vendor/Staff.
        $otherEvent = Event::when(
            $actingVendorId,
            fn ($q) => $q->where('vendor_user_id', '!=', $actingVendorId)
        )->first(['id', 'name', 'vendor_user_id']);

        $checks = [];

        foreach (['own' => $ownEvent, 'other' => $otherEvent] as $label => $event) {
            if (! $event) {
                continue;
            }

            $checks[] = [
                'event' => ['id' => $event->id, 'name' => $event->name, 'vendor_user_id' => $event->vendor_user_id],
                'relationship' => $label === 'own' ? 'Owned by your acting vendor' : "Owned by a DIFFERENT vendor",
                'expected' => $label === 'own' ? 'allow' : 'deny',
                'abilities' => [
                    'manage-event' => Gate::forUser($user)->allows('update', $event),
                    'delete-event' => Gate::forUser($user)->allows('delete', $event),
                    'publish-event' => Gate::forUser($user)->allows('publish', $event),
                ],
            ];
        }

        return Inertia::render('Admin/PermissionsTest/Index', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'roles' => $user->getRoleNames(),
            ],
            'actingVendorId' => $actingVendorId,
            'isStaff' => $user->isStaffRole(),
            'vendors' => $user->isStaffRole()
                ? $user->activeVendors()->get(['users.id', 'users.name'])
                : [],
            'checks' => $checks,
        ]);
    }
}

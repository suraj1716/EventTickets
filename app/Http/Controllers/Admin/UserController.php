<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::withCount('orders')->latest();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('name', 'like', "%$s%")
                ->orWhere('email', 'like', "%$s%"));
        }

        if ($request->filled('role')) {
            $query->role($request->role);
        }

        if ($request->filled('is_read')) {
            $query->where('is_read', $request->is_read === '1');
        }

        if ($request->filled('stripe_status')) {
            match ($request->stripe_status) {
                'connected' => $query->where('stripe_account_active', true),
                'pending'   => $query->where('stripe_account_active', false)
                                      ->whereNotNull('stripe_account_id'),
                'none'      => $query->whereNull('stripe_account_id'),
                default     => null,
            };
        }

        $users = $query->paginate(20)->through(fn($u) => [
            'id'                    => $u->id,
            'name'                  => $u->name,
            'email'                 => $u->email,
            'orders_count'          => $u->orders_count,
            'roles'                 => $u->getRoleNames(),
            'referral_code'         => $u->referral_code,
            'is_read'               => $u->is_read,
            'stripe_account_id'     => $u->stripe_account_id,
            'stripe_account_active' => $u->stripe_account_active,
            'created_at'            => $u->created_at?->format('d M Y'),
        ]);

        // Auto-mark all unread users as read when admin visits
        User::where('is_read', false)->update(['is_read' => true]);

        return Inertia::render('Admin/Users/Index', [
            'users'   => $users,
            'filters' => $request->only(['search', 'role', 'is_read', 'stripe_status']),
            'roles'   => ['Admin', 'Vendor', 'User'],
            'flash'   => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

    public function markRead(User $user)
    {
        $user->update(['is_read' => true]);
        return back()->with('success', 'Marked as read.');
    }
}

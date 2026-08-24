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

        $users = $query->paginate(20)->through(fn($u) => [
            'id'            => $u->id,
            'name'          => $u->name,
            'email'         => $u->email,
            'orders_count'  => $u->orders_count,
            'roles'         => $u->getRoleNames(),
            'referral_code' => $u->referral_code,
            'is_read'       => $u->is_read,
            'created_at'    => $u->created_at?->format('d M Y'),
        ]);

        // Auto-mark all unread users as read when admin visits
        User::where('is_read', false)->update(['is_read' => true]);

        return Inertia::render('Admin/Users/Index', [
            'users'   => $users,
            'filters' => $request->only(['search', 'role', 'is_read']),
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

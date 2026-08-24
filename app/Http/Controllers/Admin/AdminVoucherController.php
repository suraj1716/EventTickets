<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AdminVoucherController extends Controller
{
    public function index(Request $request)
    {
        $query = Voucher::with('buyer')->latest();

        if ($request->filled('search')) {
            $query->where('code', 'like', "%{$request->search}%");
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('active')) {
            $query->where('active', $request->active === '1');
        }

        $vouchers = $query->paginate(20)->through(fn($v) => [
            'id'               => $v->id,
            'code'             => $v->code,
            'type'             => $v->type,
            'discount_type'    => $v->discount_type,
            'amount'           => $v->amount,
            'remaining_amount' => $v->remaining_amount,
            'used_count'       => $v->used_count,
            'max_uses'         => $v->max_uses,
            'active'           => $v->active,
            'expires_at'       => $v->expires_at?->format('d M Y'),
            'purchased_by'     => $v->buyer?->name ?? '—',
        ]);

        return Inertia::render('Admin/Vouchers/Index', [
            'vouchers' => $vouchers,
            'filters'  => $request->only(['search', 'type', 'active']),
        ]);
    }

    public function show(Voucher $voucher)
    {
        $voucher->load('buyer');

        return Inertia::render('Admin/Vouchers/Show', [
            'voucher' => [
                'id'               => $voucher->id,
                'code'             => $voucher->code,
                'type'             => $voucher->type,
                'discount_type'    => $voucher->discount_type,
                'amount'           => $voucher->amount,
                'remaining_amount' => $voucher->remaining_amount,
                'used_count'       => $voucher->used_count,
                'max_uses'         => $voucher->max_uses,
                'active'           => $voucher->active,
                'expires_at'       => $voucher->expires_at?->format('d M Y'),
                'created_at'       => $voucher->created_at?->format('d M Y H:i'),
                'purchased_by'     => $voucher->buyer ? [
                    'id'    => $voucher->buyer->id,
                    'name'  => $voucher->buyer->name,
                    'email' => $voucher->buyer->email,
                ] : null,
                'gifted_to_email'  => $voucher->gifted_to_email ?? null,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code'          => 'nullable|string|unique:vouchers,code',
            'type'          => 'required|in:gift,promo',
            'discount_type' => 'required|in:fixed,percent',
            'amount'        => 'required|numeric|min:0',
            'max_uses'      => 'nullable|integer|min:1',
            'expires_at'    => 'nullable|date',
        ]);

        Voucher::create([
            'code'             => $request->code ?? strtoupper(Str::random(10)),
            'type'             => $request->type,
            'discount_type'    => $request->discount_type,
            'amount'           => $request->amount,
            'remaining_amount' => $request->type === 'gift' ? $request->amount : null,
            'max_uses'         => $request->max_uses,
            'expires_at'       => $request->expires_at,
            'active'           => true,
        ]);

        return back()->with('success', 'Voucher created.');
    }

    public function edit(Voucher $voucher)
    {
        return Inertia::render('Admin/Vouchers/Edit', [
            'voucher' => [
                'id'             => $voucher->id,
                'code'           => $voucher->code,
                'type'           => $voucher->type,
                'discount_type'  => $voucher->discount_type,
                'amount'         => $voucher->amount,
                'max_uses'       => $voucher->max_uses,
                'expires_at'     => $voucher->expires_at?->format('Y-m-d'),
                'active'         => $voucher->active,
                'gifted_to_email'=> $voucher->gifted_to_email ?? '',
            ],
        ]);
    }

    public function update(Request $request, Voucher $voucher)
    {
        $request->validate([
            'code'           => "required|string|unique:vouchers,code,{$voucher->id}",
            'type'           => 'required|in:gift,promo',
            'discount_type'  => 'required|in:fixed,percent',
            'amount'         => 'required|numeric|min:0',
            'max_uses'       => 'nullable|integer|min:1',
            'expires_at'     => 'nullable|date',
            'active'         => 'boolean',
            'gifted_to_email'=> 'nullable|email',
        ]);

        $voucher->update([
            'code'            => strtoupper($request->code),
            'type'            => $request->type,
            'discount_type'   => $request->discount_type,
            'amount'          => $request->amount,
            'max_uses'        => $request->max_uses,
            'expires_at'      => $request->expires_at,
            'active'          => $request->boolean('active'),
            'gifted_to_email' => $request->gifted_to_email,
        ]);

        return redirect()->route('admin.vouchers.show', $voucher->id)
            ->with('success', 'Voucher updated.');
    }

    public function toggle(Voucher $voucher)
    {
        $voucher->update(['active' => !$voucher->active]);
        return back()->with('success', 'Voucher ' . ($voucher->active ? 'activated' : 'deactivated') . '.');
    }

    public function destroy(Voucher $voucher)
    {
        $voucher->delete();
        return redirect()->route('admin.vouchers.index')
            ->with('success', 'Voucher deleted.');
    }
}

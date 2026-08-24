<?php

namespace App\Http\Controllers\Admin;

use App\Enums\RolesEnum;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vendor;
use App\Enums\VendorType;
use App\Mail\VendorApproved;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class VendorController extends Controller
{
    public function index(Request $request)
    {
        $query = Vendor::with('user')->withCount('products');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where('store_name', 'like', "%$s%")
                ->orWhereHas('user', fn($q) => $q->where('email', 'like', "%$s%"));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('vendor_type', $request->type);
        }

        $vendors = $query->latest('created_at')->paginate(20)->through(fn($v) => [
            'user_id'        => $v->user_id,
            'store_name'     => $v->store_name,
            'email'          => $v->user?->email ?? '—',
            'status'         => $v->status,
            'vendor_type'    => $v->vendor_type?->value ?? '—',
            'products_count' => $v->products_count,
            'booking_fee'    => $v->booking_fee,
            'created_at'     => $v->created_at?->format('d M Y'),
        ]);

        return Inertia::render('Admin/Vendors/Index', [
            'vendors'  => $vendors,
            'filters'  => $request->only(['search', 'status', 'type']),
            'statuses' => ['active', 'approved', 'rejected'],
            'types'    => collect(VendorType::cases())->map->value,
        ]);
    }

    public function store(Request $request)
    {

        $request->merge([
            'facebook_url'  => $request->facebook_url ?: null,
            'instagram_url' => $request->instagram_url ?: null,
            'tiktok_url'    => $request->tiktok_url ?: null,
            'youtube_url'  => $request->youtube_url ?: null,

        ]);
        $data = $request->validate([
            'name'                   => 'nullable|string|max:255',
            'email'                  => 'required|email',
            'phone'                  => 'required|string|max:30',
            'password'               => 'nullable|string|min:8',
            'store_name'             => 'required|string|max:255',
            'store_address'          => 'nullable|string|max:500',
            'vendor_type'            => ['required', Rule::in(collect(VendorType::cases())->map->value)],
            'booking_fee'            => 'required|numeric|min:0',
            'status'                 => ['required', Rule::in(['active', 'approved', 'rejected'])],
            'business_start_time'    => 'required|date_format:H:i',
            'business_end_time'      => 'required|date_format:H:i',
            'slot_interval_minutes'  => 'required|integer|min:5',
            'total_seats'            => 'required|integer|min:1',
            'recurring_closed_days'  => 'nullable|array',
            'closed_dates'           => 'nullable|array',
            'facebook_url' => 'nullable|url|max:255',
            'instagram_url' => 'nullable|url|max:255',
            'youtube_url'  => 'nullable|url|max:255',

            'tiktok_url' => 'nullable|url|max:255',
        ]);

        DB::transaction(function () use ($data) {
            $user = User::where('email', $data['email'])->first();

            if (! $user) {
                $user = User::create([
                    'name'          => $data['name'],
                    'email'         => $data['email'],
                    'phone'         => $data['phone'],
                    'password'      => Hash::make($data['password']),
                    'referral_code' => $this->generateUniqueReferralCode(),
                ]);
            } else {
                // Existing user being upgraded to vendor — keep phone in sync
                $user->update(['phone' => $data['phone']]);
            }

            if (Vendor::where('user_id', $user->id)->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'email' => 'This user is already registered as a vendor.',
                ]);
            }

            Vendor::create([
                'user_id'               => $user->id,
                'store_name'            => $data['store_name'],
                'store_address'         => $data['store_address'] ?? null,
                'vendor_type'           => $data['vendor_type'],
                'booking_fee'           => $data['booking_fee'],
                'status'                => $data['status'],
                'business_start_time'   => $data['business_start_time'],
                'business_end_time'     => $data['business_end_time'],
                'slot_interval_minutes' => $data['slot_interval_minutes'],
                'total_seats'            => $data['total_seats'],
                'recurring_closed_days' => $data['recurring_closed_days'] ?? [],
                'closed_dates'          => $data['closed_dates'] ?? [],
                'facebook_url'  => $data['facebook_url'] ?? null,
                'youtube_url'  => $data['youtube_url'] ?? null,
                'instagram_url' => $data['instagram_url'] ?? null,
                'tiktok_url'   => $data['tiktok_url'] ?? null,
            ]);

            if (! $user->hasRole(\App\Enums\RolesEnum::Vendor->value)) {
                $user->assignRole(\App\Enums\RolesEnum::Vendor->value);
            }
        });

        return back()->with('success', 'Vendor created.');
    }

    private function generateUniqueReferralCode(): string
    {
        do {
            $code = strtoupper(\Illuminate\Support\Str::random(8));
        } while (User::where('referral_code', $code)->exists());

        return $code;
    }

    public function edit(Vendor $vendor)
    {
        $vendor->load('user');

        return Inertia::render('Admin/Vendors/Edit', [
            'vendor' => [
                'user_id'                => $vendor->user_id,
                'name'                   => $vendor->user?->name,
                'email'                  => $vendor->user?->email,
                'phone'                  => $vendor->user?->phone,
                'store_name'             => $vendor->store_name,
                'store_address'          => $vendor->store_address,
                'vendor_type'            => $vendor->vendor_type?->value,
                'booking_fee'            => $vendor->booking_fee,
                'status'                 => $vendor->status,
                'business_start_time'    => $vendor->business_start_time,
                'business_end_time'      => $vendor->business_end_time,
                'slot_interval_minutes'  => $vendor->slot_interval_minutes,
                'total_seats'             => $vendor->total_seats,
                'recurring_closed_days'  => is_array($vendor->recurring_closed_days) ? $vendor->recurring_closed_days : [],
                'closed_dates'           => is_array($vendor->closed_dates) ? $vendor->closed_dates : [],
                'facebook_url' => $vendor->facebook_url,
                'youtube_url' => $vendor->youtube_url,

                'instagram_url' => $vendor->instagram_url,
                'tiktok_url' => $vendor->tiktok_url,
            ],
            'types'    => collect(VendorType::cases())->map->value,
            'statuses' => ['active', 'approved', 'rejected'],
        ]);
    }

    public function update(Request $request, Vendor $vendor)
    {
        $request->merge([
            'facebook_url'  => $request->facebook_url ?: null,
            'instagram_url' => $request->instagram_url ?: null,
            'youtube_url' => $request->youtube_url ?: null,

            'tiktok_url'    => $request->tiktok_url ?: null,
        ]);
        $data = $request->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => ['required', 'email', Rule::unique('users', 'email')->ignore($vendor->user_id)],
            'phone'                 => 'required|string|max:30',
            'store_name'            => 'required|string|max:255',
            'store_address'         => 'nullable|string|max:500',
            'vendor_type'           => ['required', Rule::in(collect(VendorType::cases())->map->value)],
            'booking_fee'           => 'nullable|numeric|min:0',
            'status'                => ['required', Rule::in(['active', 'approved', 'rejected'])],
            'business_start_time'   => 'nullable|date_format:H:i',
            'business_end_time'     => 'nullable|date_format:H:i',
            'slot_interval_minutes' => 'nullable|integer|min:5',
            'total_seats'            => 'nullable|integer|min:1',
            'recurring_closed_days' => 'nullable|array',
            'closed_dates'          => 'nullable|array',
            'facebook_url' => 'nullable|url|max:255',

            'youtube_url' => 'nullable|url|max:255',

            'instagram_url' => 'nullable|url|max:255',
            'tiktok_url' => 'nullable|url|max:255',
        ]);
        Log::info("data:", $data);
        DB::transaction(function () use ($data, $vendor) {
            $vendor->user?->update([
                'name'  => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
            ]);
 logger('vendor update payload', ['youtube_url' => $data['youtube_url'] ?? 'MISSING']);

            $vendor->update([
                'store_name'            => $data['store_name'],
                'store_address'         => $data['store_address'] ?? null,
                'vendor_type'           => $data['vendor_type'],
                'booking_fee'           => $data['booking_fee'] ?? 0,
                'status'                => $data['status'],
                'business_start_time'   => $data['business_start_time'] ?? null,
                'business_end_time'     => $data['business_end_time'] ?? null,
                'slot_interval_minutes' => $data['slot_interval_minutes'] ?? null,
                'total_seats'            => $data['total_seats'] ?? 1,
                'recurring_closed_days' => $data['recurring_closed_days'] ?? [],
                'closed_dates'          => $data['closed_dates'] ?? [],
                'facebook_url' => $data['facebook_url'] ?? null,
                'youtube_url' => $data['youtube_url'] ?? null,

                'instagram_url' => $data['instagram_url'] ?? null,
                'tiktok_url' => $data['tiktok_url'] ?? null,
            ]);
        });

        return redirect()->route('admin.vendors.index')->with('success', 'Vendor updated.');
    }


public function updateStatus(Request $request, Vendor $vendor)
{
    $request->validate(['status' => 'required|in:active,approved,rejected']);

    $wasApproved = $vendor->status === 'approved';

    $vendor->update(['status' => $request->status]);

    if ($request->status === 'approved' && !$vendor->user->hasRole(RolesEnum::Vendor)) {
        $vendor->user->assignRole(RolesEnum::Vendor);
    }

    if ($request->status === 'approved' && !$wasApproved) {
        Mail::to($vendor->user->email)->send(new VendorApproved($vendor));
    }

    return back()->with('success', 'Vendor status updated.');
}

    public function destroy(Vendor $vendor)
    {
        DB::transaction(function () use ($vendor) {
            $user = $vendor->user;
            $vendor->delete();
            $user?->delete();
        });

        return back()->with('success', 'Vendor deleted.');
    }
}

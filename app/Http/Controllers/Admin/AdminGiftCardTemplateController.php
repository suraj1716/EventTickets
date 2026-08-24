<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Enums\RolesEnum;
use App\Models\GiftCardTemplate;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AdminGiftCardTemplateController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $isAdmin = $user->hasRole(RolesEnum::Admin);
        $isVendor = $user->hasRole(RolesEnum::Vendor);

        $query = GiftCardTemplate::query()
            ->withCount('vouchers')
            ->with('vendorUser')
            ->orderBy('sort_order');

        /*
         * Vendors can only see their own templates.
         * Admins can see all templates.
         */
        if ($isVendor && ! $isAdmin) {
            $query->where('vendor_user_id', $user->id);
        }

        if ($request->filled('search')) {
            $query->where(
                'title',
                'like',
                "%{$request->search}%"
            );
        }

        if ($request->filled('active')) {
            $query->where(
                'active',
                $request->active === '1'
            );
        }
        if ($request->filled('vendor_user_id')) {
            $query->where(
                'vendor_user_id',
                $request->vendor_user_id
            );
        }

        $templates = $query
            ->paginate(20)
            ->through(fn($t) => [
                'id'             => $t->id,
                'title'          => $t->title,
                'description'    => $t->description,
                'amount'         => $t->amount,
                'image_url'      => $t->getImageUrl(),
                'active'         => $t->active,
                'sort_order'     => $t->sort_order,
                'vouchers_count' => $t->vouchers_count,

                'vendor_user_id' => $t->vendor_user_id,

                'vendor' => $t->vendorUser
                    ? [
                        'id'    => $t->vendorUser->id,
                        'name'  => $t->vendorUser->name,
                        'email' => $t->vendorUser->email,
                    ]
                    : null,

                'vendor_email' => $t->vendorUser?->email,
            ]);

        /*
         * Admin gets all vendors.
         * Vendor only gets themselves.
         */
        if ($isAdmin) {
            $vendors = User::role(RolesEnum::Vendor)
                ->with('Vendor')
                ->orderBy('name')
                ->get()
                ->map(fn($user) => [
                    'id' => $user->id,
                    'name' => $user->Vendor?->business_name
                        ?? $user->name,
                ]);
        } else {
            $vendors = collect([
                [
                    'id' => $user->id,
                    'name' => $user->Vendor?->business_name
                        ?? $user->name,
                ],
            ]);
        }

        return Inertia::render(
            'Admin/GiftCardTemplates/Index',
            [
                'templates' => $templates,
                'vendors'   => $vendors,
                'filters' => $request->only([
                    'search',
                    'active',
                    'vendor_user_id',
                ]),
                'isAdmin'   => $isAdmin,
                'isVendor'  => $isVendor,
            ]
        );
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $isAdmin = $user->hasRole(RolesEnum::Admin);
        $isVendor = $user->hasRole(RolesEnum::Vendor);

        $request->validate([
            'vendor_user_id' => [
                $isAdmin ? 'required' : 'nullable',
                'exists:users,id',
            ],
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'amount' => 'required|numeric|min:1',
            'sort_order' => 'nullable|integer|min:0',
            'image' => 'nullable|image|max:2048',
        ]);

        /*
         * Admin can choose the vendor.
         * Vendor is always assigned to themselves.
         */
      if ($isAdmin) {
    $selectedVendor = User::findOrFail($request->vendor_user_id);

    abort_unless(
        $selectedVendor->hasRole(RolesEnum::Vendor),
        422,
        'Selected user is not a vendor.'
    );

    $vendorUserId = $selectedVendor->id;
} elseif ($isVendor) {
    $vendorUserId = $user->id;
} else {
    abort(403);
}

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')
                ->store('gift-card-templates', 'public');
        }

        GiftCardTemplate::create([
            'vendor_user_id' => $vendorUserId,
            'title'          => $request->title,
            'description'    => $request->description,
            'amount'         => $request->amount,
            'sort_order'     => $request->sort_order ?? 0,
            'image_path'     => $imagePath,
            'active'         => true,
        ]);

        return back()->with(
            'success',
            'Gift card template created.'
        );
    }

    public function update(
        Request $request,
        GiftCardTemplate $giftCardTemplate
    ) {
        $user = Auth::user();

        $isAdmin = $user->hasRole(RolesEnum::Admin);
        $isVendor = $user->hasRole(RolesEnum::Vendor);

        /*
         * Vendor can only update their own template.
         * Admin can update any template.
         */
        if (
            $isVendor &&
            ! $isAdmin &&
            $giftCardTemplate->vendor_user_id !== $user->id
        ) {
            abort(403);
        }

        if (! $isAdmin && ! $isVendor) {
            abort(403);
        }

        $request->validate([
            'vendor_user_id' => [
                $isAdmin ? 'required' : 'nullable',
                'exists:users,id',
            ],
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'amount' => 'required|numeric|min:1',
            'sort_order' => 'nullable|integer|min:0',
            'active' => 'boolean',
            'image' => 'nullable|image|max:2048',
        ]);

        /*
         * Admin may change the vendor.
         * Vendor cannot change ownership.
         */
        $data = [
            'title' => $request->title,
            'description' => $request->description,
            'amount' => $request->amount,
            'sort_order' => $request->sort_order
                ?? $giftCardTemplate->sort_order,
            'active' => $request->boolean('active'),
        ];

        if ($isAdmin) {
    $selectedVendor = User::findOrFail($request->vendor_user_id);

    abort_unless(
        $selectedVendor->hasRole(RolesEnum::Vendor),
        422,
        'Selected user is not a vendor.'
    );

    $data['vendor_user_id'] = $selectedVendor->id;
}

        if ($request->hasFile('image')) {
            if ($giftCardTemplate->image_path) {
                Storage::disk('public')->delete(
                    $giftCardTemplate->image_path
                );
            }

            $data['image_path'] = $request->file('image')
                ->store('gift-card-templates', 'public');
        }

        $giftCardTemplate->update($data);

        return back()->with(
            'success',
            'Gift card template updated.'
        );
    }

    public function toggle(GiftCardTemplate $giftCardTemplate)
    {
        $user = Auth::user();

        $isAdmin = $user->hasRole(RolesEnum::Admin);
        $isVendor = $user->hasRole(RolesEnum::Vendor);

        /*
         * Admin can toggle any template.
         * Vendor can only toggle their own.
         */
        if (
            $isVendor &&
            ! $isAdmin &&
            $giftCardTemplate->vendor_user_id !== $user->id
        ) {
            abort(403);
        }

        if (! $isAdmin && ! $isVendor) {
            abort(403);
        }

        $giftCardTemplate->update([
            'active' => ! $giftCardTemplate->active,
        ]);

        return back()->with(
            'success',
            'Template ' .
                ($giftCardTemplate->active
                    ? 'activated'
                    : 'deactivated') .
                '.'
        );
    }

    public function destroy(GiftCardTemplate $giftCardTemplate)
    {
        $user = Auth::user();

        $isAdmin = $user->hasRole(RolesEnum::Admin);
        $isVendor = $user->hasRole(RolesEnum::Vendor);

        /*
         * Admin can delete any template.
         * Vendor can only delete their own.
         */
        if (
            $isVendor &&
            ! $isAdmin &&
            $giftCardTemplate->vendor_user_id !== $user->id
        ) {
            abort(403);
        }

        if (! $isAdmin && ! $isVendor) {
            abort(403);
        }

        if ($giftCardTemplate->vouchers()->exists()) {
            return back()->with(
                'error',
                'Cannot delete a template that has vouchers issued against it. Deactivate it instead.'
            );
        }

        if ($giftCardTemplate->image_path) {
            Storage::disk('public')->delete(
                $giftCardTemplate->image_path
            );
        }

        $giftCardTemplate->delete();

        return back()->with(
            'success',
            'Gift card template deleted.'
        );
    }
}

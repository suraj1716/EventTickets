<?php

namespace App\Http\Middleware;

use App\Models\Department;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        // NOTE: dpts/categories/cart totals moved to fn() closures below.
        // They used to run eagerly on every request — including partial
        // reloads like the "Load more" button on Events/Index (which only
        // asks for the `events` prop via router.reload({ only: ['events'] }))
        // and full-page filter navigations that don't touch the cart or nav
        // menu at all. Wrapping them in closures lets Inertia skip
        // evaluating them entirely when they're not part of what a given
        // request actually needs, instead of paying for 5+ queries every
        // single visit regardless of relevance.

        $cartService = app(CartService::class);

        return array_merge(parent::share($request), [

            'vendorOwnerEmail' => config('services.vendor_owner_email'),
            'appName' => config('app.name'),
            'csrf_token' => csrf_token(),
            'ziggy' => fn() => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'success' => [
                'message' => session('success'),
                'time' => microtime(true),
            ],
            'totalPrice' => fn() => $cartService->getTotalPrice(),
            'totalQuantity' => fn() => $cartService->getTotalQuantity(),
            'miniCartItems' => fn() => $cartService->getCartItems(),
            'dpts' => fn() => Cache::remember('shared:dpts', 300, function () {
                return Department::whereHas('categories.products')
                    ->withCount(['products as products_count'])
                    ->get(['id', 'name', 'slug']);
            })->map(function ($department) {
                return [
                    'id' => $department->id,
                    'name' => $department->name,
                    'slug' => $department->slug,
                    'productsCount' => $department->products_count,
                    'image' => $department->image,
                    'active' => $department->active,
                ];
            }),
            'categories' => fn() => Cache::remember('shared:categories', 300, function () {
                return \App\Models\Category::whereHas('products')
                    ->where('active', true)
                    ->get(['id', 'name', 'slug']);
            })->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                ];
            }),
            // Shared globally so Navbar/Footer/every page can read it via
            // usePage().props.vendor with zero client-side requests.
            // VendorDetailService already caches the underlying query for 6hrs,
            // so this closure is cheap even though it runs on every request.
            'vendor' => fn() => new \App\Http\Resources\VendorUserResource(
                app(\App\Services\VendorDetailService::class)->getVendorDetails()
            ),
            'adminCounts' => function () use ($request) {
                $user = $request->user();
                if (!$user) {
                    return null;
                }
                try {
                    if (!$user->can('access-admin')) {
                        return null;
                    }
                } catch (\Spatie\Permission\Exceptions\PermissionDoesNotExist $e) {
                    return null;
                }
                return [
                    'contacts' => \App\Models\Contact::where('is_read', false)->count(),
                    'orders'   => \App\Models\Order::where('is_read', false)->count(),
                    'bookings' => \App\Models\Booking::where('is_read', false)->count(),
                ];
            },
        ]);
    }
}

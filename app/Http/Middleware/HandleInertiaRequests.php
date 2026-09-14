<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
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
        return array_merge(parent::share($request), [

            'vendorOwnerEmail' => config('services.vendor_owner_email'),
            'appName' => config('app.name'),
            'csrf_token' => csrf_token(),

            // The full route table is already embedded once in the initial
            // HTML via the @routes Blade directive in app.blade.php, which
            // sets window.Ziggy for the whole session. Re-sending it here on
            // every request duplicated it on the very first load and then
            // re-shipped the entire table again on every single SPA
            // navigation after that, even though the client never discards
            // it. Only the classic (non-XHR) request — the one @routes
            // actually renders for — needs the full table; every subsequent
            // Inertia visit only needs the current URL for route()'s
            // current()/active-state checks.
            'ziggy' => fn () => $request->header('X-Inertia')
                ? ['location' => $request->url()]
                : [...(new Ziggy)->toArray(), 'location' => $request->url()],

            'success' => [
                'message' => session('success'),
                'time' => microtime(true),
            ],

            // NOTE: 'totalPrice' / 'totalQuantity' / 'miniCartItems' and
            // 'dpts' / 'categories' were removed from here — dead globals.
            // Nothing live reads them:
            //  - MiniCartDropdown(.Bottom) are the only consumers of the
            //    cart totals, and neither is mounted (NavbarBottom, their
            //    only host, is imported in AuthenticatedLayout but never
            //    rendered). Cart/Index.tsx — the one real cart page — gets
            //    its own totals straight from CartController::index already.
            //  - Department.tsx is the only consumer of dpts/categories,
            //    and its one render site in AuthenticatedLayout is inside a
            //    commented-out block.
            // If either comes back, pass it as a page-specific prop from
            // the controller that actually needs it, not a global share —
            // that's what was making every single page (including every
            // Events/Admin page that has nothing to do with a cart or a
            // department nav) pay for a CartService call and two cached
            // queries on every full load.

            // Was a live User::whereHas('vendor')... lookup (cached, but
            // still a cache-store round-trip on every request). Footer/
            // Navbar contact info doesn't need a DB record behind it —
            // see config/site.php.
            'siteSettings' => fn () => config('site'),
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

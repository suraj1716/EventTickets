<?php

use App\Enums\RolesEnum;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ShippingAddressController;
use App\Http\Controllers\StripeController;
use App\Http\Controllers\VendorController;
use App\Http\Resources\ProductListResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\GoogleController;

use App\Filament\Resources\BookingResource\Pages\CreateBooking;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\VoucherController;


Route::get('/.well-known/appspecific/com.chrome.devtools.json', fn () => response()->noContent());
// ── Public: storage file serving ────────────────────────────────────────────
Route::get('/storage/{path}', function (string $path) {
    $fullPath = storage_path('app/public/' . $path);

    if (!file_exists($fullPath)) {
        abort(404);
    }

    $mimeType = mime_content_type($fullPath);

    return response()->file($fullPath, [
        'Content-Type' => $mimeType,
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*')->name('storage.serve');

// ── Public: home / products / categories / search ───────────────────────────
Route::get('/', [ProductController::class, 'home'])->name('home');
Route::get('/products/{product:slug}', [ProductController::class, 'show'])->name('product.show');

Route::get('/categories/{category}/products', [CategoryController::class, 'products'])
    ->name('categories.products');
Route::get('/category/{category}', [CategoryController::class, 'show'])->name('category.show');
Route::get('/product-groups/{productGroup}', [ProductController::class, 'showProductGroup'])->name('productGroup.show');

Route::get('/search-suggestions', function (Request $request) {
    $keyword = $request->query('keyword');
    $products = Product::query()
        ->forWebsite()
        ->with([
            'category',
            'department',
            'user.vendor',
            'variationTypes.options.media',
            'variations',
            'reviews'
        ])
        ->where('slug', 'LIKE', "%{$keyword}%")
        ->limit(10)
        ->get();

    return ProductListResource::collection($products);
});

Route::get('/d/{department:slug}', [ProductController::class, 'byDepartment'])
    ->name('product.byDepartment');

Route::get('/shop', [ProductController::class, 'search'])->name('shop.search');

Route::get('/seller/{vendor:store_name}', [VendorController::class, 'profile'])
    ->name('vendor.profile');

Route::get('/check-auth', function () {
    return [
        'auth_id' => Auth::id(),
        'user' => Auth::user(),
    ];
});

// ── Public: Gift Card Shop (browsing — no auth required) ───────────────────
Route::get('/gift-vouchers/shop', [VoucherController::class, 'shop'])->name('gift-voucher.shop');

// ── Public: Gallery ──────────────────────────────────────────────────────────
Route::get('/gallery', [GalleryController::class, 'index'])->name('gallery.index');
Route::post('/gallery', [GalleryController::class, 'store'])->name('gallery.store');

// ── Public: Contact ──────────────────────────────────────────────────────────
Route::get('/contact', [ContactController::class, 'index'])->name('contact.index');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

// ── Public: About ────────────────────────────────────────────────────────────
Route::get('/about', function () {
    return Inertia::render('About');
})->name('about');

// ── Public: Google auth ──────────────────────────────────────────────────────
Route::get('auth/google', [GoogleController::class, 'redirectToGoogle'])->name('google.login');
Route::get('auth/google-callback', [GoogleController::class, 'handleGoogleCallback']);

// ── Public: validate promo/gift code from cart (no auth required) ──────────
Route::post('/vouchers/validate', [VoucherController::class, 'validateAndApplyCode'])
    ->name('vouchers.validate');

 Route::patch('/vouchers/{voucher}/hide', [VoucherController::class, 'hide'])
    ->name('vouchers.hide');

// ── Stripe Webhook (public, CSRF excluded) ──────────────────────────────────
Route::post('/stripe/webhook', [StripeController::class, 'handle'])
    ->name('stripe.webhook');



// ════════════════════════════════════════════════════════════════════════════
// Vendor Details service
// ════════════════════════════════════════════════════════════════════════════
Route::get('/api/vendor-details', [VendorController::class, 'public']);


// ════════════════════════════════════════════════════════════════════════════
// AUTH-PROTECTED ROUTES
// ════════════════════════════════════════════════════════════════════════════

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile/shipping-addresses', [ShippingAddressController::class, 'index'])->name('shipping.index');
    Route::post('/shipping-addresses', [ShippingAddressController::class, 'store'])->name('shipping-addresses.store');
    Route::patch('/shipping-addresses/{address}/default', [ShippingAddressController::class, 'setDefault'])->name('shipping-addresses.set-default');
    Route::put('/shipping-addresses/{shippingAddress}', [ShippingAddressController::class, 'update'])->name('shipping-addresses.update');
    Route::delete('/shipping-addresses/{id}', [ShippingAddressController::class, 'destroy'])->name('shipping-addresses.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/orders-history', [OrderController::class, 'index'])->name('orders.history');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');

    // Route::post('/admin/orders/{order}/refund', [OrderController::class, 'refund'])
    //     ->name('admin.orders.refund')
    //     ->middleware(['auth', 'role:Admin']);

    // ── Gift Card actions (require auth — browsing the shop above does not) ──
    Route::middleware('auth')->prefix('gift-vouchers')->name('gift-voucher.')->group(function () {
        Route::post('/add-to-cart', [VoucherController::class, 'addToCart'])->name('add-to-cart');
        Route::post('/purchase', [VoucherController::class, 'purchase'])->name('purchase');
        Route::get('/success', [VoucherController::class, 'success'])->name('success');
    });

    Route::middleware(['auth', 'verified'])->group(function () {
        Route::delete('/cart/gift-card/{cartItem}', [CartController::class, 'destroyGiftCard'])
            ->name('cart.gift-card.destroy');
    });

    Route::middleware(['verified'])->group(function () {
        Route::controller(CartController::class)->group(function () {
            Route::get('/cart', 'index')->name('cart.index');
            Route::post('/cart/add/{product}', 'store')->name('cart.store');
            Route::put('/cart/{product}', 'update')->name('cart.update');
            Route::delete('/cart/{product}', 'destroy')->name('cart.destroy');
        });
        Route::post('/cart/checkout', [CartController::class, 'checkout'])->name('cart.checkout');
        Route::post('/cart/voucher/add', [CartController::class, 'addVoucherToCart'])->name('cart.voucher.add');

        Route::get('/stripe/success', [StripeController::class, 'success'])->name('stripe.success');
        Route::get('/stripe/failure', [StripeController::class, 'failure'])->name('stripe.failure');
        Route::post('/create-vendor', [VendorController::class, 'store'])->name('vendor.store');
        Route::post('/become-a-vendor', [VendorController::class, 'become'])->name('vendor.become-vendor');

        Route::get('/stripe/connect/{user?}', [StripeController::class, 'connect'])->name('stripe.connect');
    });
});

// ── Bookings ─────────────────────────────────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::get('/booking-history', [BookingController::class, 'history'])->name('bookings.history');

    Route::post('/bookings/store', [BookingController::class, 'store'])->name('bookings.store');
    Route::put('/bookings/{booking}', [BookingController::class, 'update'])->name('bookings.update');
    Route::delete('/bookings/{booking}', [BookingController::class, 'destroy'])->name('bookings.destroy');

    Route::post('/bookings/{booking}/confirm', [BookingController::class, 'confirm'])->name('bookings.confirm');
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel'])->name('bookings.cancel');
    Route::get('/booking/available-slots', [BookingController::class, 'getAvailableSlots'])
        ->name('available-slots');
        Route::get('/staff-availability', [BookingController::class, 'getStaffAvailability'])->name('staff.availability');
});

// ── Reviews ──────────────────────────────────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::post('/products/{product}/reviews', [ReviewController::class, 'store'])->name('reviews.store');
});

// ── My Vouchers page + code check form ──────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/vouchers', [VoucherController::class, 'index'])
        ->name('vouchers.index');

    Route::post('/vouchers/check', [VoucherController::class, 'validateForUser'])
        ->name('vouchers.check');
});


//footer
Route::get('/api/footer-services', function () {
    return \App\Models\Category::whereHas('products', fn($q) => $q->where('status', 'published'))
        ->where('active', true)
        ->select('id', 'name', 'department_id')
        ->withCount('products')
        ->orderByDesc('products_count')
        ->get();
});

// Cancellation policy
Route::get('/cancellation-policy', fn () => Inertia::render('CancellationPolicy'))
    ->name('cancellation-policy');

require __DIR__ . '/auth.php';
require __DIR__ . '/admin_routes.php';
require __DIR__.'/events.php';

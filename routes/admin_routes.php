<?php

use App\Http\Controllers\Admin\AdminCategoriesController;
use App\Http\Controllers\Admin\AdminContactController;
use App\Http\Controllers\Admin\AdminDepartmentsController;
use App\Http\Controllers\Admin\AdminGiftCardTemplateController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\VendorController as AdminVendorController;
use App\Http\Controllers\Admin\AdminVoucherController;
use App\Http\Controllers\Admin\GalleryController;
use App\Http\Controllers\Admin\PayoutController;
use App\Http\Controllers\Admin\RosterController;
use App\Http\Controllers\StaffController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\HeroBannerController;

// ── React Admin Dashboard ──────────────────────────────────────────────────
// All routes protected by auth + Admin/Vendor role
Route::middleware(['auth', 'verified', 'role:Admin|Vendor'])
    ->prefix('dashboard')
    ->name('admin.')
    ->group(function () {

        // Product CRUD
        Route::get('/products',                    [AdminProductController::class, 'index'])->name('products.index');
        Route::get('/products/create',             [AdminProductController::class, 'create'])->name('products.create');
        Route::post('/products',                   [AdminProductController::class, 'store'])->name('products.store');
        Route::get('/products/{product}/edit',     [AdminProductController::class, 'edit'])->name('products.edit');
        Route::put('/products/{product}',          [AdminProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}',       [AdminProductController::class, 'destroy'])->name('products.destroy');

        // Categories CRUD
        Route::get('/categories',                   [AdminCategoriesController::class, 'index'])->name('categories.index');
        Route::get('/categories/create',            [AdminCategoriesController::class, 'create'])->name('categories.create');
        Route::post('/categories',                  [AdminCategoriesController::class, 'store'])->name('categories.store');
        Route::get('/categories/{category}/edit',   [AdminCategoriesController::class, 'edit'])->name('categories.edit');
        Route::put('/categories/{category}',        [AdminCategoriesController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}',     [AdminCategoriesController::class, 'destroy'])->name('categories.destroy');

        // Departments CRUD
        Route::get('/departments',                    [AdminDepartmentsController::class, 'index'])->name('departments.index');
        Route::get('/departments/create',             [AdminDepartmentsController::class, 'create'])->name('departments.create');
        Route::post('/departments',                   [AdminDepartmentsController::class, 'store'])->name('departments.store');
        Route::get('/departments/{department}/edit',  [AdminDepartmentsController::class, 'edit'])->name('departments.edit');
        Route::put('/departments/{department}',       [AdminDepartmentsController::class, 'update'])->name('departments.update');
        Route::delete('/departments/{department}',    [AdminDepartmentsController::class, 'destroy'])->name('departments.destroy');


        // Images
        Route::post('/products/{product}/images',           [AdminProductController::class, 'uploadImages'])->name('products.images.upload');
        Route::delete('/products/{product}/images/{media}', [AdminProductController::class, 'deleteImage'])->name('products.images.delete');

        // Variation types
        Route::post('/products/{product}/variation-types', [AdminProductController::class, 'saveVariationTypes'])->name('products.variation-types.save');

        // Variations
        Route::post('/products/{product}/variations',          [AdminProductController::class, 'saveVariations'])->name('products.variations.save');
        Route::post('/products/{product}/variations/generate', [AdminProductController::class, 'generateVariations'])->name('products.variations.generate');

        Route::get('/',                    [DashboardController::class, 'index'])->name('dashboard');

        // Walk-in phone lookup (JSON — must be before resource routes)
        Route::post('/orders/walkin/lookup', [AdminOrderController::class, 'lookupPhone'])->name('orders.walkin.lookup');

        // Walk-in create (uses create/store)
        Route::get('/orders/create',  [AdminOrderController::class, 'create'])->name('orders.create');
        Route::post('/orders',        [AdminOrderController::class, 'store'])->name('orders.store');

        // Standard CRUD
        Route::get('/orders',                    [AdminOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}',            [AdminOrderController::class, 'show'])->name('orders.show');
        Route::get('/orders/{order}/edit',       [AdminOrderController::class, 'edit'])->name('orders.edit');
        Route::put('/orders/{order}',            [AdminOrderController::class, 'update'])->name('orders.update');
        Route::delete('/orders/{order}',         [AdminOrderController::class, 'destroy'])->name('orders.destroy');

        // Inline actions
        Route::patch('/orders/{order}/status',   [AdminOrderController::class, 'updateStatus'])->name('orders.status');
        Route::post('/orders/{order}/refund',    [AdminOrderController::class, 'refund'])->name('orders.refund');


        // Bookings
        Route::get('/bookings',                    [AdminBookingController::class, 'index'])->name('bookings.index');
        Route::get('/bookings/create',             [AdminBookingController::class, 'create'])->name('bookings.create');
        Route::post('/bookings',                   [AdminBookingController::class, 'store'])->name('bookings.store');
        Route::get('/bookings/{booking}',          [AdminBookingController::class, 'show'])->name('bookings.show');
        Route::get('/bookings/{booking}/edit',     [AdminBookingController::class, 'edit'])->name('bookings.edit');
        Route::put('/bookings/{booking}',          [AdminBookingController::class, 'update'])->name('bookings.update');
        Route::post('/bookings/{booking}/cancel',  [AdminBookingController::class, 'cancel'])->name('bookings.cancel');
        Route::delete('/bookings/{booking}',       [AdminBookingController::class, 'destroy'])->name('bookings.destroy');

        // Users
        Route::get('/users',               [AdminUserController::class, 'index'])->name('users.index');
        Route::patch('/users/{user}/read', [AdminUserController::class, 'markRead'])->name('users.read');

        // Vouchers
        Route::get('/vouchers',                   [AdminVoucherController::class, 'index'])->name('vouchers.index');
        Route::post('/vouchers',                  [AdminVoucherController::class, 'store'])->name('vouchers.store');
        Route::get('/vouchers/{voucher}',         [AdminVoucherController::class, 'show'])->name('vouchers.show');
        Route::get('/vouchers/{voucher}/edit',    [AdminVoucherController::class, 'edit'])->name('vouchers.edit');
        Route::put('/vouchers/{voucher}',         [AdminVoucherController::class, 'update'])->name('vouchers.update');
        Route::patch('/vouchers/{voucher}/toggle', [AdminVoucherController::class, 'toggle'])->name('vouchers.toggle');
        Route::delete('/vouchers/{voucher}',      [AdminVoucherController::class, 'destroy'])->name('vouchers.destroy');


        // Gift Card Templates
        Route::get('/gift-card-templates',                    [AdminGiftCardTemplateController::class, 'index'])->name('gift-card-templates.index');
        Route::post('/gift-card-templates',                   [AdminGiftCardTemplateController::class, 'store'])->name('gift-card-templates.store');
        Route::post('/gift-card-templates/{giftCardTemplate}', [AdminGiftCardTemplateController::class, 'update'])->name('gift-card-templates.update');
        Route::patch('/gift-card-templates/{giftCardTemplate}/toggle', [AdminGiftCardTemplateController::class, 'toggle'])->name('gift-card-templates.toggle');
        Route::delete('/gift-card-templates/{giftCardTemplate}', [AdminGiftCardTemplateController::class, 'destroy'])->name('gift-card-templates.destroy');


        Route::resource('gallery', GalleryController::class);
        Route::delete('gallery/{gallery}/images/{media}', [GalleryController::class, 'destroyImage'])
            ->name('gallery.destroyImage');

        // Contacts
        Route::prefix('contacts')->name('contacts.')->group(function () {
            Route::get('/',                    [AdminContactController::class, 'index'])->name('index');
            Route::get('/{contact}',           [AdminContactController::class, 'show'])->name('show');
            Route::patch('/{contact}/read',    [AdminContactController::class, 'markRead'])->name('read');
            Route::patch('/{contact}/unread',  [AdminContactController::class, 'markUnread'])->name('unread');
            Route::delete('/{contact}',        [AdminContactController::class, 'destroy'])->name('destroy');
        });

        // Vendors
        Route::prefix('vendors')->name('vendors.')->group(function () {
            Route::get('/', [AdminVendorController::class, 'index'])->name('index');
            Route::post('/', [AdminVendorController::class, 'store'])->name('store');
            Route::get('/{vendor}/edit', [AdminVendorController::class, 'edit'])->name('edit');
            Route::put('/{vendor}', [AdminVendorController::class, 'update'])->name('update');
            Route::patch('/{vendor}/status', [AdminVendorController::class, 'updateStatus'])->name('status');
            Route::delete('/{vendor}', [AdminVendorController::class, 'destroy'])->name('destroy');
        });


        Route::prefix('vendor')->name('vendor.')->group(function () {
            Route::resource('staff', StaffController::class)
                ->except(['show', 'create', 'edit']);
        });


        Route::prefix('roster')->name('roster.')->group(function () {
            Route::get('/',                          [RosterController::class, 'index'])->name('index');
            Route::post('/bookings/{booking}/assign', [RosterController::class, 'assign'])->name('assign');
            Route::post('/bookings/{booking}/deassign', [RosterController::class, 'deassign'])->name('deassign');
        });


        Route::prefix('payouts')->name('payouts.')->group(function () {
            Route::get('/', [PayoutController::class, 'index'])->name('index');
            Route::post('/preview', [PayoutController::class, 'preview'])->name('preview');
            Route::get('/{payout}', [PayoutController::class, 'show'])->name('show');
            Route::post('/', [PayoutController::class, 'store'])->name('store');
            Route::delete('/{payout}', [PayoutController::class, 'destroy'])->name('destroy');
        });

        Route::resource('hero-banner', HeroBannerController::class)->except(['show']);
        Route::patch('hero-banner/{heroBanner}/toggle', [HeroBannerController::class, 'toggle'])
            ->name('hero-banner.toggle');




    });





Route::get('/staff-for-booking', [StaffController::class, 'forBooking'])
    ->name('staff.forBooking');

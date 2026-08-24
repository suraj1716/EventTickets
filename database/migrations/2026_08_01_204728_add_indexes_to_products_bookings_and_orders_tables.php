<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Products: status is filtered on almost every public query
        // (forWebsite(), filterApproved(), home/search/department pages).
        // slug is used for product lookups by URL.
        Schema::table('products', function (Blueprint $table) {
            $table->index('status');
            $table->index('slug');
            // Composite index speeds up the very common
            // "published products in department X" queries.
            $table->index(['status', 'department_id']);
        });

        // Bookings: booking_date is used with whereDate()/orderBy() on the
        // admin dashboard, roster, and upcoming-bookings queries.
        // user_id is a plain unsignedBigInteger with no FK, so no index exists.
        Schema::table('bookings', function (Blueprint $table) {
            $table->index('booking_date');
            $table->index('user_id');
        });

        // Orders: status/is_paid are filtered on the dashboard and admin order
        // list; user_id/vendor_user_id are plain unsignedBigInteger columns
        // (no FK constraint), so they currently have no index at all.
        Schema::table('orders', function (Blueprint $table) {
            $table->index('status');
            $table->index('is_paid');
            $table->index('user_id');
            $table->index('vendor_user_id');
            // Speeds up the dashboard's "paid orders in last 30 days" sum/group-by
            $table->index(['is_paid', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['slug']);
            $table->dropIndex(['status', 'department_id']);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['booking_date']);
            $table->dropIndex(['user_id']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['is_paid']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['vendor_user_id']);
            $table->dropIndex(['is_paid', 'created_at']);
        });
    }
};

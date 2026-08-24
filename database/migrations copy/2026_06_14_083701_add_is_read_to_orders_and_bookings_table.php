<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::table('orders', function (Blueprint $table) {
        if (!Schema::hasColumn('orders', 'is_read')) {
            $table->boolean('is_read')->default(false)->after('status');
        }
    });
    Schema::table('bookings', function (Blueprint $table) {
        if (!Schema::hasColumn('bookings', 'is_read')) {
            $table->boolean('is_read')->default(false)->after('status');
        }
    });
}

public function down(): void
{
    Schema::table('orders', function (Blueprint $table) {
        if (Schema::hasColumn('orders', 'is_read')) {
            $table->dropColumn('is_read');
        }
    });
    Schema::table('bookings', function (Blueprint $table) {
        if (Schema::hasColumn('bookings', 'is_read')) {
            $table->dropColumn('is_read');
        }
    });
}
};

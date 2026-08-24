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
    Schema::table('users', function (Blueprint $table) {
        if (!Schema::hasColumn('users', 'phone')) {
            $table->string('phone')->nullable()->after('email');
        }
        if (!Schema::hasColumn('users', 'is_read')) {
            $table->boolean('is_read')->default(false)->after('remember_token');
        }
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        if (Schema::hasColumn('users', 'phone')) {
            $table->dropColumn('phone');
        }
        if (Schema::hasColumn('users', 'is_read')) {
            $table->dropColumn('is_read');
        }
    });
}
};

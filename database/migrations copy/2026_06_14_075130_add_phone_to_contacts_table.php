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
    Schema::table('contacts', function (Blueprint $table) {
        if (!Schema::hasColumn('contacts', 'phone')) {
            $table->string('phone')->nullable()->after('email');
        }
        if (!Schema::hasColumn('contacts', 'is_read')) {
            $table->boolean('is_read')->default(false)->after('file_path');
        }
    });
}

public function down(): void
{
    Schema::table('contacts', function (Blueprint $table) {
        if (Schema::hasColumn('contacts', 'phone')) {
            $table->dropColumn('phone');
        }
        if (Schema::hasColumn('contacts', 'is_read')) {
            $table->dropColumn('is_read');
        }
    });
}
};

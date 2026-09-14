<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The /events sidebar does:
 *   departments where active = true
 *   categories where active = true and parent_id is null and department_id in (...)
 *
 * Postgres does NOT auto-index foreign key columns the way MySQL does
 * (foreignId()->constrained() only adds the FK constraint, not a btree
 * index), so department_id and parent_id have never had index support
 * despite being filtered on every single /events load. active has no
 * index on either table either. Composite index leads with active
 * since every query on these tables filters on it first.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->index('active');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->index(['active', 'parent_id', 'department_id']);
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropIndex(['active']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['active', 'parent_id', 'department_id']);
        });
    }
};

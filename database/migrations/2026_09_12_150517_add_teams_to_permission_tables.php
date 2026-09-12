<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the DB column spatie/laravel-permission's "teams" feature needs
 * (vendor_id as the team key, matching the vendor_staff table), WITHOUT
 * turning the feature on — config('permission.teams') stays false, so
 * this changes no runtime behavior yet. Every existing roles /
 * model_has_roles / model_has_permissions row gets vendor_id = NULL and
 * is otherwise untouched.
 *
 * Deliberately does NOT touch the existing primary keys / unique
 * constraints here: a primary key can never contain NULL (Postgres
 * enforces this strictly; MySQL would reject it too once real NULL rows
 * exist), and every row here is NULL until teams is actually turned on.
 * That key/constraint rework belongs to the later "flip teams on"
 * migration, done together with a real data-backfill plan — see the
 * note in config/permission.php for why that's a separate, larger piece
 * of work than this file.
 */
return new class extends Migration
{
    public function up(): void
    {
        $teamKey = config('permission.column_names.team_foreign_key', 'vendor_id');

        Schema::table('roles', function (Blueprint $table) use ($teamKey) {
            $table->unsignedBigInteger($teamKey)->nullable()->after('id');
            $table->index($teamKey, 'roles_team_foreign_key_index');
        });

        Schema::table('model_has_roles', function (Blueprint $table) use ($teamKey) {
            $table->unsignedBigInteger($teamKey)->nullable()->after('role_id');
            $table->index($teamKey, 'model_has_roles_team_foreign_key_index');
        });

        Schema::table('model_has_permissions', function (Blueprint $table) use ($teamKey) {
            $table->unsignedBigInteger($teamKey)->nullable()->after('permission_id');
            $table->index($teamKey, 'model_has_permissions_team_foreign_key_index');
        });
    }

    public function down(): void
    {
        $teamKey = config('permission.column_names.team_foreign_key', 'vendor_id');

        Schema::table('model_has_permissions', function (Blueprint $table) use ($teamKey) {
            $table->dropIndex('model_has_permissions_team_foreign_key_index');
            $table->dropColumn($teamKey);
        });

        Schema::table('model_has_roles', function (Blueprint $table) use ($teamKey) {
            $table->dropIndex('model_has_roles_team_foreign_key_index');
            $table->dropColumn($teamKey);
        });

        Schema::table('roles', function (Blueprint $table) use ($teamKey) {
            $table->dropIndex('roles_team_foreign_key_index');
            $table->dropColumn($teamKey);
        });
    }
};

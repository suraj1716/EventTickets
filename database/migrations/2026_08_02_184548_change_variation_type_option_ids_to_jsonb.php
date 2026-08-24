<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('
                ALTER TABLE cart_items
                ALTER COLUMN variation_type_option_ids
                TYPE jsonb
                USING variation_type_option_ids::jsonb
            ');
        }
        // MySQL/MariaDB already creates this column as JSON
        // in the original create_cart_items_table migration.
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('
                ALTER TABLE cart_items
                ALTER COLUMN variation_type_option_ids
                TYPE json
                USING variation_type_option_ids::json
            ');
        }
    }
};

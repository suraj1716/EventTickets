<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('
                ALTER TABLE product_variations
                ALTER COLUMN variation_type_option_ids
                TYPE jsonb
                USING variation_type_option_ids::jsonb
            ');

            DB::statement('
                ALTER TABLE order_items
                ALTER COLUMN variation_type_option_ids
                TYPE jsonb
                USING variation_type_option_ids::jsonb
            ');
        }

        // MariaDB/MySQL:
        // These columns are already created as JSON by their original migrations.
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('
                ALTER TABLE product_variations
                ALTER COLUMN variation_type_option_ids
                TYPE json
                USING variation_type_option_ids::json
            ');

            DB::statement('
                ALTER TABLE order_items
                ALTER COLUMN variation_type_option_ids
                TYPE json
                USING variation_type_option_ids::json
            ');
        }
    }
};

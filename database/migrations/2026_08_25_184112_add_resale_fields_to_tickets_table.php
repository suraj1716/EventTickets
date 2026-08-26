<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('owner_user_id')
                ->nullable()
                ->after('order_id')
                ->constrained('users')
                ->nullOnDelete();

            $table->unsignedInteger('times_resold')
                ->default(0)
                ->after('status');
        });

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement('
                UPDATE tickets
                INNER JOIN orders ON orders.id = tickets.order_id
                SET tickets.owner_user_id = orders.user_id
                WHERE tickets.owner_user_id IS NULL
            ');
        } else {
            DB::statement('
                UPDATE tickets
                SET owner_user_id = (
                    SELECT orders.user_id
                    FROM orders
                    WHERE orders.id = tickets.order_id
                )
                WHERE owner_user_id IS NULL
            ');
        }

        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement(
                "ALTER TABLE tickets
                 MODIFY status ENUM('valid', 'listed', 'used', 'void')
                 DEFAULT 'valid'"
            );
        }
    }

    public function down(): void
    {
        if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement(
                "ALTER TABLE tickets
                 MODIFY status ENUM('valid', 'used', 'void')
                 DEFAULT 'valid'"
            );
        }

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_user_id');
            $table->dropColumn('times_resold');
        });
    }
};

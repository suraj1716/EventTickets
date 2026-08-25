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
            // Current holder — distinct from order_id, which stays
            // pointed at the ORIGINAL purchase forever (financial/audit
            // record). owner_user_id is who the ticket actually belongs
            // to right now and is what changes on a resale transfer.
            $table->foreignId('owner_user_id')->nullable()->after('order_id')
                ->constrained('users')->nullOnDelete();

            // How many times this ticket has changed hands via a
            // platform resale purchase. 0 = original buyer still holds
            // it — this is what the "Never resold" badge checks.
            $table->unsignedInteger('times_resold')->default(0)->after('status');
        });

        // Backfill owner_user_id for existing tickets from their order's
        // buyer, so nothing is left null after this migration runs.
        DB::statement('
            UPDATE tickets
            INNER JOIN orders ON orders.id = tickets.order_id
            SET tickets.owner_user_id = orders.user_id
            WHERE tickets.owner_user_id IS NULL
        ');

        // Extend the status enum with 'listed' — a ticket that's
        // currently up for resale. It cannot be scanned while in this
        // state, even by its current owner, so a seller can't list a
        // ticket for sale and also use it themselves at the door while
        // waiting for a buyer.
        DB::statement("ALTER TABLE tickets MODIFY status ENUM('valid', 'listed', 'used', 'void') DEFAULT 'valid'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE tickets MODIFY status ENUM('valid', 'used', 'void') DEFAULT 'valid'");

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_user_id');
            $table->dropColumn('times_resold');
        });
    }
};

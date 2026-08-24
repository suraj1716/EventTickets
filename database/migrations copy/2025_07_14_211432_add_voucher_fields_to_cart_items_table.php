<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddVoucherFieldsToCartItemsTable extends Migration
{
    public function up()
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $columns = DB::getSchemaBuilder()->getColumnListing('cart_items');

            if (!in_array('voucher_id', $columns)) {
                $table->foreignId('voucher_id')->nullable()->constrained()->nullOnDelete();
            }

            if (!in_array('amount', $columns)) {
                $table->decimal('amount', 10, 2)->nullable()->after('price');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            //
        });
    }
}

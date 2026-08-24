<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('refunds', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
            $table->dropUnique(['order_id', 'type']);
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('refunds', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->unique(['order_id', 'type']);
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index(['status', 'created_by']);
            $table->index(['status', 'created_at']);
            $table->index(['status', 'category_id']);
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->index(['user_id', 'status']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->index('product_id');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->index('department_id');
        });

        Schema::table('product_group_product', function (Blueprint $table) {
            $table->index('product_group_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_by']);
            $table->dropIndex(['status', 'created_at']);
            $table->dropIndex(['status', 'category_id']);
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['department_id']);
        });

        Schema::table('product_group_product', function (Blueprint $table) {
            $table->dropIndex(['product_group_id']);
            $table->dropIndex(['product_id']);
        });
    }
};

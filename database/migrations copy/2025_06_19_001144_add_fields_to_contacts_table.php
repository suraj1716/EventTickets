<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->string('reason')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->integer('quantity')->nullable();
            $table->string('file_path')->nullable();


            // Optional: add foreign key constraints if needed
            // $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            // $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
            // $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn([
                'reason',
                'department_id',
                'category_id',
                'product_id',
                'quantity',
                'file_path',

            ]);
        });
    }
};

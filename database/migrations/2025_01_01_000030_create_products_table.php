<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('title', 2000);
            $table->string('product_type')->default('product');
            $table->string('slug', 2000);
            $table->longText('description');
            $table->foreignId('department_id')->constrained('departments');
            $table->foreignId('category_id')->constrained('categories');
            $table->decimal('price', 20, 4);
            $table->string('status');
            $table->string('highlight')->nullable();
            $table->boolean('require_additional_file')->default(false);
            $table->integer('quantity')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->constrained('users');
            $table->softDeletes();
            $table->timestamps();
            $table->json('deleted_combinations')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};

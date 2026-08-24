<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('department_vendor', function (Blueprint $table) {
            $table->unsignedBigInteger('vendor_user_id');
            $table->unsignedBigInteger('department_id');
            $table->foreign('vendor_user_id')->references('user_id')->on('vendors')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->primary(['vendor_user_id', 'department_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_vendor');
    }
};

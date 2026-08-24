<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_vendor', function (Blueprint $table) {
            $table->foreignId('vendor_user_id')->constrained('vendors', 'user_id')->cascadeOnDelete();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->primary(['vendor_user_id', 'department_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_vendor');
    }
};

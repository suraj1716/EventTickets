<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Long free text, same shape as events.description — refund /
            // entry / privacy terms shown as its own section on the
            // buyer-side event page.
            $table->text('policy')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('policy');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddGoogleTokensToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_access_token')->nullable()->after('remember_token');
            $table->string('google_refresh_token')->nullable()->after('google_access_token');
            $table->timestamp('token_expires_at')->nullable()->after('google_refresh_token');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'google_access_token',
                'google_refresh_token',
                'token_expires_at'
            ]);
        });
    }
}

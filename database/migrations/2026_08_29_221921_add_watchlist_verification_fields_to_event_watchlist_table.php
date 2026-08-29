<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_watchlist', function (Blueprint $table) {
            $table->timestamp('verified_at')
                ->nullable()
                ->after('user_id');

            $table->string('verification_token_hash', 64)
                ->nullable()
                ->after('verified_at');

            $table->timestamp('verification_expires_at')
                ->nullable()
                ->after('verification_token_hash');

            $table->index('verification_token_hash');
        });
    }

    public function down(): void
    {
        Schema::table('event_watchlist', function (Blueprint $table) {
            $table->dropIndex([
                'event_watchlist_verification_token_hash_index',
            ]);

            $table->dropColumn([
                'verified_at',
                'verification_token_hash',
                'verification_expires_at',
            ]);
        });
    }
};

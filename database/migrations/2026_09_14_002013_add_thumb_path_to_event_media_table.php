<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Nullable/backfill-friendly: existing rows keep working off `path`
    // via EventMedia::getUrlAttribute() until a re-upload (or the backfill
    // command) populates thumb_path. Nothing breaks in the meantime —
    // getThumbUrlAttribute() falls back to the full-size url() when null.
    public function up(): void
    {
        Schema::table('event_media', function (Blueprint $table) {
            $table->string('thumb_path')->nullable()->after('path');
        });
    }

    public function down(): void
    {
        Schema::table('event_media', function (Blueprint $table) {
            $table->dropColumn('thumb_path');
        });
    }
};
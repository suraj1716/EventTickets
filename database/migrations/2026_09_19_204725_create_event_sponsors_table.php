<?php

use App\Enums\SponsorTierEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_sponsors', function (Blueprint $table) {
            $table->id();

            $table->foreignId('event_id')
                ->constrained('events')
                ->cascadeOnDelete();

            $table->string('name');

            // Disk-relative path, same convention as event_media.path —
            // the public URL is built by the accessor on EventSponsor,
            // never stored, so switching disks doesn't rewrite rows.
            $table->string('logo_path')->nullable();

            // Plain string, not a DB enum: new tiers are a code change.
            // Validated against SponsorTierEnum at the request layer.
            $table->string('tier', 20)->default(SponsorTierEnum::OTHER->value);

            $table->string('website_url')->nullable();

            // Manual ordering within a tier.
            $table->unsignedSmallInteger('position')->default(0);

            $table->timestamps();

            // The only query that ever hits this table is "all sponsors for
            // one event, in display order".
            $table->index(['event_id', 'tier', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_sponsors');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('hero_banners', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('subtitle')->nullable();
    $table->string('button_text')->nullable();
    $table->string('button_link')->nullable();
    $table->string('image_path');
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

    }

    public function down()
    {
        Schema::table('hero_banners', function (Blueprint $table) {
            $table->dropColumn([
                'title',
                'subtitle',
                'button_text',
                'button_link',
                'image_path',
                'is_active',
            ]);
        });
    }
};

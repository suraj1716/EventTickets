<?php

// Static footer/navbar contact info. Previously this was a live
// User::whereHas('vendor')... query + Cache::rememberForever() lookup,
// re-run (from cache, but still a round-trip) on every single request.
// This content — business name, contact details, socials — changes maybe
// once every few months via a manual deploy, not something worth a
// runtime lookup for. Values come from .env so they're still editable
// without a code change; update .env and restart/reload PHP-FPM (or
// `php artisan config:cache`) to pick up a change — no cache to bust.
//
// Field names deliberately match what VendorUserResource used to return
// (phone, store_address, business_start_time, etc.) so Footer.tsx/
// Navbar.tsx needed a source swap, not a field-by-field rewrite.

return [
    'name' => env('SITE_VENDOR_NAME', config('app.name')),
    'email' => env('SITE_VENDOR_EMAIL'),
    'phone' => env('SITE_VENDOR_PHONE'),
    'store_address' => env('SITE_VENDOR_ADDRESS'),

    'business_start_time' => env('SITE_BUSINESS_START_TIME', '09:00'),
    'business_end_time' => env('SITE_BUSINESS_END_TIME', '18:00'),
    // Comma-separated day numbers (0=Sunday..6=Saturday), e.g. "0,6" for
    // closed on weekends. Kept as a plain env string and split here so
    // there's nothing to JSON-decode or store as a DB array column.
    'recurring_closed_days' => array_filter(
        array_map('trim', explode(',', env('SITE_CLOSED_DAYS', '')))
    ),

    'facebook_url' => env('SITE_FACEBOOK_URL'),
    'instagram_url' => env('SITE_INSTAGRAM_URL'),
    'tiktok_url' => env('SITE_TIKTOK_URL'),
    'youtube_url' => env('SITE_YOUTUBE_URL'),
];

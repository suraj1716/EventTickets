<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$rows = Illuminate\Support\Facades\DB::table('products')
    ->leftJoin('vendors', 'vendors.user_id', '=', 'products.created_by')
    ->select('products.id', 'products.title', 'products.status', 'products.created_by', 'vendors.user_id as vendor_user_id', 'vendors.status as vendor_status')
    ->get();

foreach ($rows as $r) {
    echo "product_id={$r->id} title={$r->title} status={$r->status} created_by={$r->created_by} has_vendor="
        . ($r->vendor_user_id ? 'YES' : 'NO')
        . " vendor_status=" . ($r->vendor_status ?? 'N/A')
        . PHP_EOL;
}

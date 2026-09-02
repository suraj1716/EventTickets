<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "DB connection: " . config('database.default') . PHP_EOL;
echo "DB database: " . config('database.connections.' . config('database.default') . '.database') . PHP_EOL;
echo "---" . PHP_EOL;

$row = Illuminate\Support\Facades\DB::table('vendors')->where('user_id', 1)->first();
print_r($row);

echo "---all vendors---" . PHP_EOL;
print_r(Illuminate\Support\Facades\DB::table('vendors')->get()->toArray());

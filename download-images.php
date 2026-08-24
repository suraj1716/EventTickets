<?php
$images = [
    "keratin-treatment"   => "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg",
    "brazilian-blowout"   => "https://images.pexels.com/photos/3993467/pexels-photo-3993467.jpeg",
    "deep-conditioning"   => "https://images.pexels.com/photos/3738347/pexels-photo-3738347.jpeg",
    "ladies-haircut"      => "https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg",
    "mens-haircut"        => "https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg",
    "kids-haircut"        => "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg",
    "blow-dry-style"      => "https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg",
    "full-hair-colour"    => "https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg",
    "highlights-balayage" => "https://images.pexels.com/photos/3997993/pexels-photo-3997993.jpeg",
    "root-touch-up"       => "https://images.pexels.com/photos/3738373/pexels-photo-3738373.jpeg",
    "classic-manicure"    => "https://images.pexels.com/photos/939836/pexels-photo-939836.jpeg",
    "classic-pedicure"    => "https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg",
    "gel-nails"           => "https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg",
    "eyebrow-threading"   => "https://images.pexels.com/photos/3997983/pexels-photo-3997983.jpeg",
    "facial-threading"    => "https://images.pexels.com/photos/3997986/pexels-photo-3997986.jpeg",
];
$dir = __DIR__ . "/database/seeders/images/products/";
foreach ($images as $name => $url) {
    $dest = $dir . $name . ".jpg";
    echo "Downloading $name... ";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $data = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($httpCode === 200 && strlen($data) > 10000) {
        file_put_contents($dest, $data);
        echo "OK (" . round(strlen($data)/1024) . "KB)\n";
    } else {
        echo "FAILED (HTTP $httpCode, " . strlen($data) . " bytes)\n";
    }
}

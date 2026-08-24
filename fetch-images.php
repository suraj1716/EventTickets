<?php

$apiKey = env('PEXELS_API_KEY');
if (empty($apiKey)) {
    echo 'PEXELS_API_KEY not found in .env' . PHP_EOL;
    return;
}

$names = [
    'Hair Straightening', 'Hair Treatment', 'Colour & Foils', 'Hair Cut',
    'Facial', 'Face Bleach', 'Threading', 'Eye Treatment', 'Waxing',
    'Permanent Hair Straight', 'Temporary Hair Straight',
    'Normal Keratin Treatment', 'Brazilian Keratin Treatment', 'Basin Treatment',
    'Hair Protein Treatment', 'Charcoal Treatment', 'Wash and Blowdry', 'Hair Oil Massage',
    'Herbal Henna', 'Toner', 'Regrowth', 'Full Hair Colour', 'Full Head Foils',
    'Half Head Foils', 'Mens Hair Colour',
    'Kids Hair Cut', 'Hair Trimming', 'Style Hair',
    'Normal Cleansing', 'Fruit Facial', 'Normal Facial', 'Aroma Acne Facial',
    'Aroma Pigmentation Facial', 'Shahnaz Normal Facial', 'Shahnaz Gold Facial',
    'Advance Vitamin C Facial',
    'Fruit Bleach', 'Gold Bleach',
    'Eyebrows Threading', 'Upperlips Threading', 'Forehead Threading', 'Chin Threading',
    'Neck Line Threading', 'Side Cheeks Threading', 'Full Face Threading',
    'Eyebrows Tint', 'Eyelashes Tint', 'Brows Lashes Tint Combo',
    'Eyebrows Waxing', 'Upperlips Waxing', 'Forehead Waxing', 'Chin Waxing',
    'Sides Waxing', 'Side Cheeks Waxing', 'Full Face Waxing', 'Full Legs Waxing',
    'Half Legs Waxing', 'Full Arms Waxing', 'Half Arms Waxing', 'Under Arms Waxing',
    'Front Wax', 'Back Wax', 'Stomach Waxing', 'Bikini Waxing', 'High Bikini Waxing',
    'Brazilian Wax', 'Buttocks Waxing', 'Full Body Wax',
];

$overrides = [
    'Permanent Hair Straight' => 'hair straightening salon',
    'Temporary Hair Straight' => 'hair blow dry straight',
    'Normal Keratin Treatment' => 'keratin hair treatment salon',
    'Brazilian Keratin Treatment' => 'brazilian blowout hair salon',
    'Basin Treatment' => 'hair wash basin salon',
    'Hair Protein Treatment' => 'hair protein treatment salon',
    'Charcoal Treatment' => 'charcoal hair mask treatment',
    'Wash and Blowdry' => 'hair wash blow dry salon',
    'Hair Oil Massage' => 'scalp oil massage spa',
    'Herbal Henna' => 'henna hair dye',
    'Toner' => 'hair toner salon',
    'Regrowth' => 'hair root touch up salon',
    'Full Hair Colour' => 'hair coloring salon',
    'Full Head Foils' => 'hair foils highlights salon',
    'Half Head Foils' => 'hair foils highlights',
    'Mens Hair Colour' => 'mens hair color salon',
    'Kids Hair Cut' => 'kids haircut salon',
    'Hair Trimming' => 'hair trim scissors salon',
    'Style Hair' => 'hair styling salon',
    'Normal Cleansing' => 'facial cleansing spa',
    'Fruit Facial' => 'fruit facial spa treatment',
    'Normal Facial' => 'facial treatment spa',
    'Aroma Acne Facial' => 'acne facial spa treatment',
    'Aroma Pigmentation Facial' => 'facial skincare treatment spa',
    'Shahnaz Normal Facial' => 'facial spa treatment',
    'Shahnaz Gold Facial' => 'gold facial spa luxury',
    'Advance Vitamin C Facial' => 'vitamin c facial skincare',
    'Fruit Bleach' => 'face skincare treatment spa',
    'Gold Bleach' => 'gold facial skincare spa',
    'Eyebrows Threading' => 'eyebrow threading beauty salon',
    'Upperlips Threading' => 'face threading beauty salon',
    'Forehead Threading' => 'face threading beauty salon',
    'Chin Threading' => 'face threading beauty salon',
    'Neck Line Threading' => 'beauty salon threading treatment',
    'Side Cheeks Threading' => 'face threading beauty salon',
    'Full Face Threading' => 'face threading beauty treatment',
    'Eyebrows Tint' => 'eyebrow tint beauty salon',
    'Eyelashes Tint' => 'eyelash tint beauty salon',
    'Brows Lashes Tint Combo' => 'eyebrow eyelash tint beauty',
    'Eyebrows Waxing' => 'eyebrow waxing beauty salon',
    'Upperlips Waxing' => 'face waxing beauty salon',
    'Forehead Waxing' => 'face waxing beauty salon',
    'Chin Waxing' => 'face waxing beauty salon',
    'Sides Waxing' => 'face waxing beauty treatment',
    'Side Cheeks Waxing' => 'face waxing beauty salon',
    'Full Face Waxing' => 'facial waxing beauty treatment',
    'Full Legs Waxing' => 'leg waxing spa treatment',
    'Half Legs Waxing' => 'leg waxing beauty spa',
    'Full Arms Waxing' => 'arm waxing spa treatment',
    'Half Arms Waxing' => 'arm waxing beauty spa',
    'Under Arms Waxing' => 'underarm waxing spa',
    'Front Wax' => 'body waxing spa treatment',
    'Back Wax' => 'back waxing spa treatment',
    'Stomach Waxing' => 'body waxing spa treatment',
    'Bikini Waxing' => 'bikini waxing spa treatment',
    'High Bikini Waxing' => 'bikini waxing beauty spa',
    'Brazilian Wax' => 'waxing spa beauty treatment',
    'Buttocks Waxing' => 'body waxing spa treatment',
    'Full Body Wax' => 'full body waxing spa',
];

$catDir = base_path('database/seeders/images/categories');
$prodDir = base_path('database/seeders/images/products');

foreach ([$catDir, $prodDir] as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
        echo 'Created: ' . $dir . PHP_EOL;
    }
}

foreach ($names as $name) {
    $slug = \Illuminate\Support\Str::slug($name);
    $query = $overrides[$name] ?? ($name . ' hair salon');

    $response = \Illuminate\Support\Facades\Http::withHeaders([
        'Authorization' => $apiKey,
    ])->get('https://api.pexels.com/v1/search', [
        'query' => $query,
        'per_page' => 1,
        'orientation' => 'square',
    ]);

    if (!$response->ok()) {
        echo 'API ERROR (' . $response->status() . '): ' . $name . ' - query: ' . $query . PHP_EOL;
        continue;
    }

    $photos = $response->json('photos');
    if (empty($photos)) {
        echo 'NO RESULTS: ' . $name . ' - query: ' . $query . PHP_EOL;
        continue;
    }

    $imageUrl = $photos[0]['src']['large'] ?? null;
    if (!$imageUrl) {
        echo 'NO IMAGE URL: ' . $name . PHP_EOL;
        continue;
    }

    $imageBytes = \Illuminate\Support\Facades\Http::get($imageUrl)->body();

    foreach (['categories' => $catDir, 'products' => $prodDir] as $folder => $dir) {
        $dest = $dir . DIRECTORY_SEPARATOR . $slug . '.jpg';
        file_put_contents($dest, $imageBytes);
        echo 'OK: ' . $folder . '/' . $slug . '.jpg' . PHP_EOL;
    }

    usleep(150000);
}

echo 'Done.' . PHP_EOL;

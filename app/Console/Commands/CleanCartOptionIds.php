<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CartItem;

class CleanCartOptionIds extends Command
{
    protected $signature = 'cart:clean-option-ids';
    protected $description = 'Clean variation_type_option_ids JSON formatting in cart_items table';

public function handle()
{
    $this->info('🔧 Starting cleanup of variation_type_option_ids...');

    $items = \App\Models\CartItem::all();
    $fixedCount = 0;
    $skippedCount = 0;

    foreach ($items as $item) {
        // Get the raw DB value with all the escaping
        $raw = $item->getRawOriginal('variation_type_option_ids');

        $decoded = $this->recursivelyDecode($raw);

        if (is_array($decoded)) {
            ksort($decoded);
            $decoded = array_map('strval', $decoded);
            $cleanJson = json_encode($decoded);

            // Compare to raw DB value (string) — not casted array
            if ($cleanJson !== $raw) {
                // Save cleaned JSON string directly to DB field bypassing casts
                $item->setRawAttributes(array_merge(
                    $item->getAttributes(),
                    ['variation_type_option_ids' => $cleanJson]
                ));

                $item->save();
                $fixedCount++;
                $this->info("✅ Cleaned item ID {$item->id}");
            }
        } else {
            $skippedCount++;
            $this->warn("❌ Skipped item ID {$item->id}: Could not decode after 10 tries");
        }
    }

    $this->info("🏁 Cleanup complete. Fixed: {$fixedCount}, Skipped: {$skippedCount}");
}



    /**
     * Recursively decode a deeply escaped JSON string.
     */
   private function recursivelyDecode($input, $maxDepth = 10)
{
    $decoded = $input;

    for ($i = 0; $i < $maxDepth; $i++) {
        // Remove outer quotes if they exist
        if (is_string($decoded)) {
            $decoded = trim($decoded, "\"");
        }

        // Remove slashes
        $decoded = stripslashes($decoded);

        // Try decoding
        $try = json_decode($decoded, true);

        if (is_array($try)) {
            return $try;
        }
    }

    return null;
}

}

<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\GiftCardTemplate;
use App\Models\Product;
use App\Models\VariationTypeOption;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CartService
{
    private ?array $cachedCartItems = null;
    protected const COOKIE_NAME = 'cartItems';
    protected const COOKIE_LIFETIME = 60 * 24 * 30; // 30 days

    // ── GIFT CARD METHODS (new) ────────────────────────────────────

    /**
     * Add a gift card template to the cart.
     * Gift cards are always quantity 1 per line, no options, no variations.
     * Only works for authenticated users (gift cards require an account).
     */
    public function addGiftCardToCart(GiftCardTemplate $template, string $giftedToEmail = null): void
    {
        if (! Auth::check()) {
            abort(401, 'You must be logged in to purchase a gift card.');
        }

        // One line per template (don't stack — each is a separate voucher)
        CartItem::create([
            'user_id'              => Auth::id(),
            'item_type' => 'gift_card',
            'product_id'           => null,                  // no product
            'gift_card_template_id' => $template->id,
            'quantity'             => 1,
            'price'                => $template->amount,
            'variation_type_option_ids' => json_encode([]),
            'gifted_to_email'      => $giftedToEmail,        // stored on cart item temporarily
        ]);
    }

    public function setTicketCartItems(array $lines): void
    {
        if (! Auth::check()) {
            abort(401, 'You must be logged in to buy tickets.');
        }

        CartItem::where('user_id', Auth::id())
            ->whereNotNull('ticket_tier_id')
            ->delete();

        foreach ($lines as $line) {
            $tier = \App\Models\TicketTier::findOrFail(
                $line['ticket_tier_id']
            );

            if (! $tier->isOpen()) {
                abort(
                    422,
                    "\"{$tier->name}\" is no longer available."
                );
            }

            $seatIds = collect($line['seat_ids'] ?? [])
                ->map(fn($id) => (int) $id)
                ->unique()
                ->values()
                ->all();

            if (
                $seatIds &&
                count($seatIds) !== (int) $line['quantity']
            ) {
                abort(
                    422,
                    'The number of selected seats must match the ticket quantity.'
                );
            }

            if ($seatIds) {
                $seats = \App\Models\EventSeat::whereIn('id', $seatIds)
                    ->where('event_leg_id', $tier->event_leg_id)
                    ->where('status', 'available')
                    ->get();

                if ($seats->count() !== count($seatIds)) {
                    abort(
                        422,
                        'One or more selected seats are no longer available.'
                    );
                }

                $invalidTierSeat = $seats->first(
                    fn($seat) =>
                    $seat->ticket_tier_id !== null &&
                        (int) $seat->ticket_tier_id !== (int) $tier->id
                );

                if ($invalidTierSeat) {
                    abort(
                        422,
                        'One or more selected seats do not belong to this ticket tier.'
                    );
                }
            } elseif ($tier->eventLeg?->seating_type === 'reserved') {
                abort(
                    422,
                    'Please select seats for this ticket.'
                );
            }

            if ($line['quantity'] > $tier->remaining) {
                abort(
                    422,
                    "Only {$tier->remaining} left for \"{$tier->name}\"."
                );
            }

            CartItem::create([
                'user_id' => Auth::id(),
                'item_type' => 'ticket',
                'product_id' => null,
                'ticket_tier_id' => $tier->id,
                'quantity' => $line['quantity'],
                'price' => $tier->price,
                'variation_type_option_ids' => json_encode([]),
                'seat_ids' => $seatIds ?: null,
            ]);
        }
    }
public function setEventMerchCartItems(int $eventId, array $lines): void
{
    if (! Auth::check()) {
        abort(401, 'You must be logged in to buy merchandise.');
    }

    $eventProductIds = Product::where('event_id', $eventId)->pluck('id');

    // Wipe any stale product selections for this event before adding
    // the current ones — same buy-now replace semantics as tickets,
    // so abandoned attempts don't silently stack.
    CartItem::where('user_id', Auth::id())
        ->where('item_type', 'product')
        ->whereIn('product_id', $eventProductIds)
        ->delete();

    foreach ($lines as $line) {
        $product = Product::findOrFail($line['product_id']);

        abort_unless(
            $product->event_id === $eventId,
            422,
            'Product does not belong to this event.'
        );

        $this->addItemToCart($product, $line['quantity'], $line['option_ids'] ?? []);
    }
}
    // ── EXISTING PRODUCT METHODS (unchanged) ─────────────────────

    public function addItemToCart(Product $product, int $quantity = 1, $optionIds = null, bool $designer = false)
    {
       $optionIds = $this->normalizeOptionIds($optionIds ?? request()->input('option_ids'));
    if (empty($optionIds)) {
        $optionIds = $product->getFirstOptionsMap();
    }
    ksort($optionIds);

    // Was: trusted request()->input('price') if present. That let a
    // client submit any price for any product/variant. Compute it
    // server-side from the product's own variation pricing instead.
    $price = $product->getPriceForOptions($optionIds);

    $designer = request()->boolean('designer', false);

        $attachmentPath = null;
        $attachmentFileName = null;
        if (request()->hasFile('attachment')) {
            $file = request()->file('attachment');
            request()->validate([
                'attachment' => 'file|mimes:jpeg,png,pdf|max:2048',
            ]);
            $attachmentFileName = $file->getClientOriginalName();
            $attachmentPath = $file->storeAs('attachments', $attachmentFileName, 'public');
        }

        if (Auth::check()) {
            $this->saveItemToDatabase($product->id, $quantity, $price, $optionIds, $attachmentPath, $attachmentFileName, $designer);
        } else {
            $this->saveItemToCookies($product->id, $quantity, $price, $optionIds, $attachmentPath, $attachmentFileName, $designer);
        }
    }

    public function updateItemQuantity(int $productId, int $quantity, $optionIds = null)
    {
        if (is_string($optionIds)) {
            $optionIds = json_decode($optionIds, true) ?: [];
        }
        if (!is_array($optionIds)) {
            $optionIds = [];
        }
        ksort($optionIds);

        if (Auth::check()) {
            $this->updateItemQuantityInDatabase($productId, $quantity, $optionIds);
        } else {
            $this->updateItemQuantityInCookies($productId, $quantity, $optionIds);
        }
    }

    public function removeItemFromCart(int $productId, $optionIds = null)
    {
        if (is_string($optionIds)) {
            $optionIds = json_decode($optionIds, true) ?: [];
        }
        if (!is_array($optionIds)) {
            $optionIds = [];
        }
        ksort($optionIds);

        if (Auth::check()) {
            $this->removeItemFromDatabase($productId, $optionIds);
        } else {
            $this->removeItemFromCookies($productId, $optionIds);
        }
    }
    public function removeGiftCardFromCart(int $cartItemId): void
    {
        CartItem::where('user_id', Auth::id())
            ->whereNotNull('gift_card_template_id')
            ->where('id', $cartItemId)
            ->delete();
    }
    // ── getCartItems — patched to include gift cards ──────────────

    public function getCartItems(): array
    {
        try {
            if ($this->cachedCartItems === null) {
                $regularItems  = $this->getRegularCartItems();
                $giftCardItems = Auth::check() ? $this->getGiftCardCartItems() : [];
                $ticketItems   = Auth::check() ? $this->getTicketCartItems() : [];

                $this->cachedCartItems = array_merge($regularItems, $giftCardItems, $ticketItems);
            }

            return $this->cachedCartItems;
        } catch (\Exception $e) {
            Log::error('CartService getCartItems error: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
        }

        return [];
    }

    /**
     * Original getCartItems logic, extracted — handles regular products only.
     */
    protected function getRegularCartItems(): array
    {
        if (Auth::check()) {
            $cartItems = $this->getCartItemsFromDatabase();
        } else {
            $cartItems = $this->getCartItemsFromCookies();
        }

        $productIds = collect($cartItems)->pluck('product_id')->filter()->unique()->values();
        $products = Product::whereIn('id', $productIds)
            ->with('user.vendor')
            ->forWebsite()
            ->get()
            ->keyBy('id');

        $cartItemData = [];

        foreach ($cartItems as $cartItem) {
            // Skip gift card rows (they have no product_id)
            if (empty($cartItem['product_id'])) continue;

            $product = $products->get($cartItem['product_id']);
            if (! $product) continue;

            $optionIds = [];

            if (isset($cartItem['option_ids'])) {
                if (is_string($cartItem['option_ids'])) {
                    $optionIds = json_decode($cartItem['option_ids'], true) ?: [];
                } elseif (is_array($cartItem['option_ids'])) {
                    $optionIds = $cartItem['option_ids'];
                }
            } elseif (isset($cartItem['variation_type_option_ids'])) {
                if (is_string($cartItem['variation_type_option_ids'])) {
                    $optionIds = json_decode($cartItem['variation_type_option_ids'], true) ?: [];
                } elseif (is_array($cartItem['variation_type_option_ids'])) {
                    $optionIds = $cartItem['variation_type_option_ids'];
                }
            }

            if (! is_array($optionIds)) $optionIds = [];

            $options = VariationTypeOption::with('variationType')
                ->whereIn('id', $optionIds)
                ->get()
                ->keyBy('id');

            $optionInfo = [];
            $imageUrl   = null;

            foreach ($optionIds as $optionId) {
                $option = $options->get($optionId);
                if (! $option) continue;

                if (! $imageUrl && $option->getFirstMediaUrl('images', 'small')) {
                    $imageUrl = $option->getFirstMediaUrl('images', 'small');
                }

                $optionInfo[] = [
                    'id'   => $option->id,
                    'name' => $option->name,
                    'type' => [
                        'id'   => $option->variationType->id,
                        'name' => $option->variationType->name,
                    ],
                ];
            }

            $imageUrl = $imageUrl ?: $product->getFirstMediaUrl('images', 'thumb');

            $cartItemData[] = [
                'id'              => $cartItem['id'] ?? null,
                'product_id'      => $product->id,
                'title'           => $product->title,
                'slug'            => $product->slug,
                'price'           => $cartItem['price'],
                'quantity'        => $cartItem['quantity'],
                'option_ids'      => $optionIds,
                'options'         => $optionInfo,
                'image_url'       => $imageUrl,
                'is_gift_card'    => false,
                'user' => [
                    'id'           => $product->created_by,
                    'name'         => $product->user->vendor->store_name ?? null,
                    'email'        => $product->user->email,
                    'booking_fee'  => $product->user->vendor->booking_fee,
                    'vendor_type'  => $product->user->vendor->vendor_type,
                ],
                'attachment_path' => $cartItem['attachment_path'] ?? null,
                'attachment_name' => $cartItem['attachment_name'] ?? null,
                'designer'        => $cartItem['designer'] ?? false,
            ];
        }

        return $cartItemData;
    }

    /**
     * Load gift card cart items for authenticated users.
     * Groups under a virtual 'gift_cards' vendor so the cart UI handles them separately.
     */
    protected function getGiftCardCartItems(): array
    {
        $rows = CartItem::where('user_id', Auth::id())
            ->whereNotNull('gift_card_template_id')
            ->with('giftCardProduct')
            ->get();

        $items = [];

        foreach ($rows as $row) {
            $template = $row->giftCardProduct;
            if (! $template || ! $template->active) continue;

            $items[] = [
                'id'              => $row->id,
                'product_id'      => null,
                'gift_card_template_id' => $template->id,
                'title'           => $template->title,
                'slug'            => null,
                'price'           => $row->price,
                'quantity'        => 1,               // always 1 per line
                'option_ids'      => [],
                'options'         => [],
                'image_url'       => $template->getImageUrl(),
                'is_gift_card'    => true,
                'gifted_to_email' => $row->gifted_to_email ?? null,
                // Gift cards group under a virtual vendor with id=0
                'user' => [
                    'id'          => 0,
                    'name'        => 'Gift Cards',
                    'email'        => null,
                    'booking_fee' => 0,
                    'vendor_type' => null,
                ],
                'attachment_path' => null,
                'attachment_name' => null,
                'designer'        => false,
            ];
        }

        return $items;
    }
    public function getTicketCartItems(): array
    {
        $rows = CartItem::where('user_id', Auth::id())
            ->whereNotNull('ticket_tier_id')
            ->with('ticketTier.eventLeg.event')
            ->get();

        $items = [];

        foreach ($rows as $row) {
            $tier = $row->ticketTier;

            if (! $tier || ! $tier->isOpen()) {
                continue;
            }

            $leg = $tier->eventLeg;
            $event = $leg?->event;

            if (! $event || ! $event->vendor_user_id) {
                continue;
            }

            $vendorUser = \App\Models\User::find($event->vendor_user_id);

            if (! $vendorUser) {
                continue;
            }

            $items[] = [
                'id' => $row->id,
                'product_id' => null,
                'ticket_tier_id' => $tier->id,
                'title' => $event->name . ' — ' . $tier->name,
                'slug' => $event->slug,
                'price' => $tier->price,
                'quantity' => $row->quantity,
                'option_ids' => [],
                'options' => [],
                'image_url' => null,
                'is_ticket' => true,
                'seat_ids' => $row->seat_ids ?? [],
                'user' => [
                    'id' => $vendorUser->id,
                    'name' => $vendorUser->name,
                    'email' => $vendorUser->email,
                    'booking_fee' => 0,
                    'vendor_type' => null,
                ],

                'attachment_path' => null,
                'attachment_name' => null,
                'designer' => false,
            ];
        }

        return $items;
    }
    public function getTotalQuantity(): int
    {
        return array_reduce($this->getCartItems(), fn($carry, $item) => $carry + $item['quantity'], 0);
    }

    public function getTotalPrice(): float
    {
        return array_reduce($this->getCartItems(), fn($carry, $item) => $carry + ($item['price'] * $item['quantity']), 0.0);
    }

    // ── getCartItemsGrouped — unchanged logic, gift cards auto-group ──


    public function getTicketCartItemsGrouped(): array
    {
        return collect($this->getTicketCartItems())
            ->groupBy(fn($item) => $item['user']['id'])
            ->map(function ($items) {
                $firstItem = $items->first();

                return [
                    'user' => $firstItem['user'],
                    'vendor' => [
                        'id' => $firstItem['user']['id'],
                        'name' => $firstItem['user']['name'],
                        'email' => $firstItem['user']['email'],
                        'booking_fee' => 0,
                        'vendor_type' => null,
                    ],
                    'items' => $items->values()->toArray(),
                    'totalQuantity' => $items->sum('quantity'),
                    'totalPrice' => $items->sum(
                        fn($item) => $item['price'] * $item['quantity']
                    ),
                ];
            })
            ->toArray();
    }

    public function getCartItemsGrouped(): array
    {
        $cartItems = $this->getCartItems();

        return collect($cartItems)
            ->groupBy(fn($item) => $item['user']['id'])
            ->map(function ($items, $userId) {
                $firstItem = $items->first();

                // ── FIX: vendor comes from the 'user' key on each cart item ──
                // The old code did: $firstItem['product']['vendor'] ?? null
                // which is ALWAYS null — there is no 'product' key in cart items.
                // The user array IS the vendor info (store_name, booking_fee, etc.)
                $vendor = [
                    'id'          => $firstItem['user']['id'],
                    'name'        => $firstItem['user']['name'],
                    'email'       => $firstItem['user']['email'],
                    'booking_fee' => $firstItem['user']['booking_fee'] ?? 0,
                    'vendor_type' => $firstItem['user']['vendor_type'] ?? null,
                ];

                return [
                    'user'          => $firstItem['user'],
                    'vendor'        => $vendor,          // ← now always populated
                    'items'         => $items->toArray(),
                    'totalQuantity' => $items->sum('quantity'),
                    'totalPrice'    => $items->sum(fn($item) => $item['price'] * $item['quantity']),
                ];
            })
            ->toArray();
    }

    // ── Database helpers (all unchanged) ─────────────────────────

    protected function updateItemQuantityInDatabase(int $productId, int $quantity, array $optionIds): void
    {
        $userId         = Auth::id();
        $normOptionIds  = $this->normalizeOptionIds($optionIds);
        $itemKey        = $productId . '_' . json_encode($normOptionIds);

        $cartItems    = $this->getCartItemsFromDatabase();
        $cartItemsMap = [];
        foreach ($cartItems as $item) {
            $itemNormOptionIds = $this->normalizeOptionIds($item['option_ids']);
            $key = $item['product_id'] . '_' . json_encode($itemNormOptionIds);
            $cartItemsMap[$key] = $item;
        }

        if (isset($cartItemsMap[$itemKey])) {
            $cartItemsMap[$itemKey]['quantity'] = $quantity;
        }

        $cartItem = CartItem::where('user_id', $userId)
            ->where('product_id', $productId)
            ->get()
            ->first(function ($item) use ($normOptionIds) {
                return json_decode((string)($item->variation_type_option_ids ?? ''), true) == $normOptionIds;
            });

        if ($cartItem) {
            $cartItem->update(['quantity' => $quantity]);
        }
    }

    protected function updateItemQuantityInCookies(int $productId, int $quantity, array $optionIds): void
    {
        $cartItems       = $this->getCartItemsFromCookies();
        ksort($optionIds);
        $encodedOptionIds = json_encode($optionIds);
        $itemKey          = $productId . '_' . $encodedOptionIds;

        if (isset($cartItems[$itemKey])) {
            $cartItems[$itemKey]['quantity'] = $quantity;
        }

        Cookie::queue(self::COOKIE_NAME, json_encode($cartItems), self::COOKIE_LIFETIME);
    }

    protected function saveItemToDatabase(
        int $productId,
        int $quantity,
        $price,
        array $optionIds,
        ?string $attachmentPath = null,
        ?string $attachmentFileName = null,
        bool $designer = false
    ): void {
        $userId           = Auth::id();
        $optionIds        = $this->normalizeOptionIds($optionIds);
        ksort($optionIds);
        $encodedOptionIds = json_encode($optionIds);

        $cartItem = CartItem::where('user_id', $userId)
            ->where('product_id', $productId)
            ->where('variation_type_option_ids', $encodedOptionIds)
            ->first();

        if ($cartItem) {
            $updateData = ['quantity' => 1];
            if ($attachmentPath !== null)     $updateData['attachment_path'] = $attachmentPath;
            if ($attachmentFileName !== null) $updateData['attachment_name'] = $attachmentFileName;
            $cartItem->update($updateData);
        } else {
            CartItem::create([
                'user_id'                    => $userId,
                'item_type' => 'product',
                'product_id'                 => $productId,
                'quantity'                   => 1,
                'variation_type_option_ids'  => $optionIds,
                'price'                      => $price,
                'attachment_path'            => $attachmentPath,
                'attachment_name'            => $attachmentFileName,
                'designer'                   => $designer,
            ]);
        }
    }




    protected function saveItemToCookies(
        int $productId,
        int $quantity,
        $price,
        $optionIds,
        ?string $attachmentPath = null,
        ?string $attachmentFileName = null,
        bool $designer = false
    ): void {
        if (is_string($optionIds)) {
            $decoded   = json_decode($optionIds, true);
            $optionIds = is_array($decoded) ? $decoded : [];
        } elseif (! is_array($optionIds)) {
            $optionIds = [];
        }

        ksort($optionIds);
        $normalizedOptionIds = array_map('strval', $optionIds);
        $encodedOptionIds    = json_encode($normalizedOptionIds);
        $cartItems           = $this->getCartItemsFromCookies();
        $itemKey             = $productId . '_' . $encodedOptionIds;

        if (isset($cartItems[$itemKey])) {
            $cartItems[$itemKey]['quantity'] = 1;
            if ($attachmentPath !== null) {
                $cartItems[$itemKey]['attachment_path'] = $attachmentPath;
                $cartItems[$itemKey]['attachment_name'] = $attachmentFileName;
            }
        } else {
            $cartItems[$itemKey] = [
                'product_id'      => $productId,
                'quantity'        => 1,
                'price'           => $price,
                'option_ids'      => $normalizedOptionIds,
                'attachment_path' => $attachmentPath,
                'attachment_name' => $attachmentFileName,
                'designer'        => $designer,
            ];
        }

        Cookie::queue(self::COOKIE_NAME, json_encode($cartItems), self::COOKIE_LIFETIME);
    }
    protected function removeItemFromDatabase(int $productId, array $optionIds): void
    {
        $userId    = Auth::id();
        $optionIds = array_map('strval', $optionIds);
        ksort($optionIds);

        $cartItems = CartItem::where('user_id', $userId)
            ->where('product_id', $productId)
            ->get();

        foreach ($cartItems as $cartItem) {
            $dbOptionIdsRaw = $cartItem->variation_type_option_ids;
            $dbOptionIds    = [];

            if (is_string($dbOptionIdsRaw)) {
                $decoded = json_decode($dbOptionIdsRaw, true);
                if (is_array($decoded) && array_is_list($decoded)) continue;
                $dbOptionIds = $decoded;
            } elseif (is_array($dbOptionIdsRaw)) {
                $dbOptionIds = $dbOptionIdsRaw;
            }

            if (is_array($dbOptionIds)) {
                ksort($dbOptionIds);
                ksort($optionIds);
                if ($dbOptionIds === $optionIds) {
                    $cartItem->delete();
                }
            }
        }
    }

    protected function removeItemFromCookies(int $productId, array $optionIds): void
    {
        $cartItems        = $this->getCartItemsFromCookies();
        ksort($optionIds);
        $encodedOptionIds = json_encode($optionIds);
        $itemKey          = $productId . '_' . $encodedOptionIds;

        if (isset($cartItems[$itemKey])) {
            unset($cartItems[$itemKey]);
            if (empty($cartItems)) {
                Cookie::queue(Cookie::forget(self::COOKIE_NAME));
            } else {
                Cookie::queue(self::COOKIE_NAME, json_encode($cartItems), self::COOKIE_LIFETIME);
            }
        }
    }

    protected function getCartItemsFromDatabase(): array
    {
        $userId = Auth::id();

        // Only regular product rows (gift cards loaded separately)
        return CartItem::where('user_id', $userId)
            ->whereNotNull('product_id')
            ->paginate(50)
            ->map(function ($cartItem) {
                return [
                    'id'              => $cartItem->id,
                    'product_id'      => $cartItem->product_id,
                    'quantity'        => $cartItem->quantity,
                    'option_ids'      => $this->normalizeOptionIds($cartItem->variation_type_option_ids),
                    'price'           => $cartItem->price,
                    'attachment_path' => $cartItem->attachment_path,
                    'attachment_name' => $cartItem->attachment_name,
                    'designer'        => $cartItem->designer,
                ];
            })->toArray();
    }

    public function getCartItemsFromCookies(): array
    {
        $cookieValue = request()->cookie(self::COOKIE_NAME);
        if (! $cookieValue) return [];

        $cartItems = json_decode($cookieValue, true);
        if (! is_array($cartItems)) return [];

        $normalizedCartItems = [];
        foreach ($cartItems as $key => $item) {
            $normalizedCartItems[$key] = [
                'product_id'      => $item['product_id'] ?? null,
                'quantity'        => $item['quantity'] ?? 0,
                'price'           => $item['price'] ?? 0,
                'option_ids'      => $item['option_ids'] ?? [],
                'attachment_path' => $item['attachment_path'] ?? null,
                'attachment_name' => $item['attachment_name'] ?? null,
                'designer'        => $item['designer'] ?? false,
            ];
        }

        return $normalizedCartItems;
    }

    public function moveCartItemsToDatabase($userId): void
    {
        $cartItems = $this->getCartItemsFromCookies();

        foreach ($cartItems as $cartItem) {
            $optionIds       = $this->normalizeOptionIds($cartItem['option_ids'] ?? []);
            $optionIdsJson   = json_encode($optionIds);

            $existingItem = CartItem::where('user_id', $userId)
                ->where('product_id', $cartItem['product_id'])
                ->where('variation_type_option_ids', $optionIdsJson)
                ->first();

            if ($existingItem) {
                $updateData = ['quantity' => $existingItem->quantity + $cartItem['quantity']];
                if (isset($cartItem['attachment_path'])) $updateData['attachment_path'] = $cartItem['attachment_path'];
                if (isset($cartItem['attachment_name'])) $updateData['attachment_name'] = $cartItem['attachment_name'];
                $existingItem->update($updateData);
            } else {
                CartItem::create([
                    'user_id'                   => $userId,
                    'item_type' => 'product',
                    'product_id'                => $cartItem['product_id'],
                    'quantity'                  => $cartItem['quantity'],
                    'price'                     => $cartItem['price'],
                    'variation_type_option_ids' => $optionIdsJson,
                    'attachment_path'           => $cartItem['attachment_path'] ?? null,
                    'attachment_name'           => $cartItem['attachment_name'] ?? null,
                    'designer'                  => $cartItem['designer'] ?? false,
                ]);
            }
        }

        Cookie::queue(Cookie::forget(self::COOKIE_NAME));
    }

    protected function normalizeOptionIds($optionIds): array
    {
        if (is_string($optionIds)) {
            $decoded   = json_decode($optionIds, true);
            $optionIds = is_array($decoded) ? $decoded : [];
        }

        if (! is_array($optionIds)) {
            $optionIds = [];
        }

        if (array_is_list($optionIds)) {
            $optionIds = collect($optionIds)
                ->values()
                ->mapWithKeys(fn($value, $index) => [strval($index + 1) => strval($value)])
                ->toArray();
        } else {
            $optionIds = collect($optionIds)
                ->mapWithKeys(fn($value, $key) => [strval($key) => strval($value)])
                ->toArray();
        }

        ksort($optionIds);
        return $optionIds;
    }
}







// namespace App\Services;

// use App\Models\CartItem;
// use App\Models\Product;
// use App\Models\VariationTypeOption;
// use Illuminate\Support\Facades\Auth;
// use Illuminate\Support\Facades\Cookie;
// use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Log;
// use Illuminate\Support\Str;

// class CartService
// {
//     private ?array $cachedCartItems = null;
//     protected const COOKIE_NAME = 'cartItems';
//     protected const COOKIE_LIFETIME = 60 * 24 * 30; // 30 days

//     public function addItemToCart(Product $product, int $quantity = 1, $optionIds = null, bool $designer = false)
//     {


//         $optionIds = $this->normalizeOptionIds($optionIds ?? request()->input('option_ids'));
//         if (empty($optionIds)) {
//             $optionIds = $product->getFirstOptionsMap(); // fallback
//         }

//         ksort($optionIds);

//         $submittedPrice = request()->input('price');
//         $price = (is_numeric($submittedPrice) && $submittedPrice > 0) ? $submittedPrice : $product->price;

//         $designer = request()->boolean('designer', false);


//         $attachmentPath = null;
//         $attachmentFileName = null;
//         if (request()->hasFile('attachment')) {
//             $file = request()->file('attachment');
//             request()->validate([
//                 'attachment' => 'file|mimes:jpeg,png,pdf|max:2048',
//             ]);
//             $attachmentFileName = $file->getClientOriginalName();
//             $attachmentPath = $file->storeAs('attachments', $attachmentFileName, 'public');
//         }

//         if (Auth::check()) {
//             $this->saveItemToDatabase($product->id, $quantity, $price, $optionIds, $attachmentPath, $attachmentFileName, $designer);
//         } else {
//             $this->saveItemToCookies($product->id, $quantity, $price, $optionIds, $attachmentPath, $attachmentFileName, $designer);
//         }
//     }



//     public function updateItemQuantity(int $productId, int $quantity, $optionIds = null)
//     {
//         if (is_string($optionIds)) {
//             $optionIds = json_decode($optionIds, true) ?: [];
//         }
//         if (!is_array($optionIds)) {
//             $optionIds = [];
//         }
//         ksort($optionIds);

//         if (Auth::check()) {
//             $this->updateItemQuantityInDatabase($productId, $quantity, $optionIds);
//         } else {
//             $this->updateItemQuantityInCookies($productId, $quantity, $optionIds);
//         }
//     }


//     public function removeItemFromCart(int $productId, $optionIds = null)
//     {
//         if (is_string($optionIds)) {
//             $optionIds = json_decode($optionIds, true) ?: [];
//         }
//         if (!is_array($optionIds)) {
//             $optionIds = [];
//         }
//         ksort($optionIds);

//         if (Auth::check()) {
//             $this->removeItemFromDatabase($productId, $optionIds);
//         } else {
//             $this->removeItemFromCookies($productId, $optionIds);
//         }
//     }

//     public function getCartItems(): array
//     {
//         try {
//             if ($this->cachedCartItems === null) {
//                 if (Auth::check()) {
//                     $cartItems = $this->getCartItemsFromDatabase();
//                 } else {
//                     $cartItems = $this->getCartItemsFromCookies();
//                 }

//                 $productIds = collect($cartItems)->pluck('product_id')->unique()->values();
//                 $products = Product::whereIn('id', $productIds)
//                     ->with('user.vendor')
//                     ->forWebsite()
//                     ->get()
//                     ->keyBy('id');

//                 $cartItemData = [];

//                 foreach ($cartItems as $cartItem) {
//                     $product = $products->get($cartItem['product_id']);
//                     if (!$product) continue;

//                     $optionIds = [];

//                     if (isset($cartItem['option_ids'])) {
//                         if (is_string($cartItem['option_ids'])) {
//                             $optionIds = json_decode($cartItem['option_ids'], true) ?: [];
//                         } elseif (is_array($cartItem['option_ids'])) {
//                             $optionIds = $cartItem['option_ids'];
//                         }
//                     } elseif (isset($cartItem['variation_type_option_ids'])) {
//                         if (is_string($cartItem['variation_type_option_ids'])) {
//                             $optionIds = json_decode($cartItem['variation_type_option_ids'], true) ?: [];
//                         } elseif (is_array($cartItem['variation_type_option_ids'])) {
//                             $optionIds = $cartItem['variation_type_option_ids'];
//                         }
//                     }


//                     if (!is_array($optionIds)) {
//                         $optionIds = [];
//                     }

//                     $options = VariationTypeOption::with('variationType')
//                         ->whereIn('id', $optionIds)
//                         ->get()
//                         ->keyBy('id');

//                     $optionInfo = [];
//                     $imageUrl = null;

//                     foreach ($optionIds as $optionId) {
//                         $option = $options->get($optionId);
//                         if (!$option) continue;

//                         if (!$imageUrl && $option->getFirstMediaUrl('images', 'small')) {
//                             $imageUrl = $option->getFirstMediaUrl('images', 'small');
//                         }

//                         $optionInfo[] = [
//                             "id" => $option->id,
//                             "name" => $option->name,
//                             "type" => [
//                                 'id' => $option->variationType->id,
//                                 'name' => $option->variationType->name,
//                             ]
//                         ];
//                     }

//                     $imageUrl = $imageUrl ?: $product->getFirstMediaUrl('images', 'thumb');

//                     $cartItemData[] = [
//                         'id' => $cartItem['id'] ?? null,
//                         'product_id' => $product->id,
//                         'title' => $product->title,
//                         'slug' => $product->slug,
//                         'price' => $cartItem['price'],
//                         'quantity' => $cartItem['quantity'],
//                         'option_ids' => $optionIds,
//                         'options' => $optionInfo,
//                         'image_url' => $imageUrl,
//                         'user' => [
//                             'id' => $product->created_by,
//                             'name' => $product->user->vendor->store_name ?? null,
//                             'booking_fee' => $product->user->vendor->booking_fee,
//                             'vendor_type' => $product->user->vendor->vendor_type,
//                         ],


//                         'attachment_path' => $cartItem['attachment_path'] ?? null,
//                         'attachment_name' => $cartItem['attachment_name'] ?? null,
//                         'designer'=>$cartItem['designer'] ?? false

//                     ];
//                 }

//                 $this->cachedCartItems = $cartItemData;
//             }

//             return $this->cachedCartItems;
//         } catch (\Exception $e) {
//             Log::error('CartService getCartItems error: ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString());
//         }


//         return [];
//     }

//     public function getTotalQuantity(): int
//     {
//         return array_reduce($this->getCartItems(), fn($carry, $item) => $carry + $item['quantity'], 0);
//     }

//     public function getTotalPrice(): float
//     {
//         return array_reduce($this->getCartItems(), fn($carry, $item) => $carry + ($item['price'] * $item['quantity']), 0.0);
//     }

//     protected function updateItemQuantityInDatabase(int $productId, int $quantity, array $optionIds): void
//     {
//         $userId = Auth::id();

//         // Normalize option IDs once
//         $normOptionIds = $this->normalizeOptionIds($optionIds);

//         // Create the key string for lookup
//         $itemKey = $productId . '_' . json_encode($normOptionIds);

//         Log::debug('Update quantity called', [
//             'user_id' => $userId,
//             'product_id' => $productId,
//             'quantity' => $quantity,
//             'normalized_option_ids' => $normOptionIds,
//             'encoded_option_ids' => json_encode($normOptionIds),
//         ]);

//         $cartItems = $this->getCartItemsFromDatabase();

//         // Build a map keyed by productId_encodedOptionIds
//         $cartItemsMap = [];
//         foreach ($cartItems as $item) {
//             $itemNormOptionIds = $this->normalizeOptionIds($item['option_ids']);
//             $key = $item['product_id'] . '_' . json_encode($itemNormOptionIds);
//             $cartItemsMap[$key] = $item;
//         }

//         if (isset($cartItemsMap[$itemKey])) {
//             Log::debug('Item key found in cartItemsMap', ['itemKey' => $itemKey]);
//             $cartItemsMap[$itemKey]['quantity'] = $quantity;
//         } else {
//             Log::debug('Item key NOT found in cartItemsMap', ['itemKey' => $itemKey]);
//         }

//         // Now update DB item directly
//         $cartItem = CartItem::where('user_id', $userId)
//             ->where('product_id', $productId)
//             ->get()
//             ->first(function ($item) use ($normOptionIds) {
//                 return json_decode((string)($item->variation_type_option_ids ?? ''), true) == $normOptionIds;
//             });


//         if ($cartItem) {
//             Log::debug('CartItem found in DB', ['cartItem_id' => $cartItem->id]);
//             $cartItem->update([
//                 'quantity' => $quantity,
//             ]);
//             Log::debug('CartItem quantity updated');
//         } else {
//             Log::debug('No CartItem found in DB');
//         }
//     }



//     protected function updateItemQuantityInCookies(int $productId, int $quantity, array $optionIds): void
//     {
//         $cartItems = $this->getCartItemsFromCookies();

//         ksort($optionIds);
//         $encodedOptionIds = json_encode($optionIds);

//         $itemKey = $productId . '_' . $encodedOptionIds;

//         if (isset($cartItems[$itemKey])) {
//             $cartItems[$itemKey]['quantity'] = $quantity;
//         }

//         Cookie::queue(self::COOKIE_NAME, json_encode($cartItems), self::COOKIE_LIFETIME);
//     }

//     protected function saveItemToDatabase(
//         int $productId,
//         int $quantity,
//         $price,
//         array $optionIds,
//         ?string $attachmentPath = null,
//         ?string $attachmentFileName = null,
//         bool $designer = false
//     ): void {
//         $userId = Auth::id();

//         $optionIds = $this->normalizeOptionIds($optionIds);
//         ksort($optionIds); // ensure consistent key order
//         $encodedOptionIds = json_encode($optionIds); // for DB comparison and storage

//         $cartItem = CartItem::where('user_id', $userId)
//             ->where('product_id', $productId)
//             ->where('variation_type_option_ids',  $encodedOptionIds)
//             ->first();

//         if ($cartItem) {
//             $updateData = [
//                 'quantity' => DB::raw('quantity + ' . $quantity),
//             ];

//             if ($attachmentPath !== null) {
//                 $updateData['attachment_path'] = $attachmentPath;
//             }
//             if ($attachmentFileName !== null) {
//                 $updateData['attachment_name'] = $attachmentFileName;
//             }

//             $cartItem->update($updateData);

//             Log::debug('Cart item updated', $updateData);
//         } else {
//             CartItem::create([
//                 'user_id' => $userId,
//                  'item_type' => 'product',
//                 'product_id' => $productId,
//                 'quantity' => $quantity,
//                 'variation_type_option_ids' =>  $optionIds,
//                 'price' => $price,
//                 'attachment_path' => $attachmentPath,
//                 'attachment_name' => $attachmentFileName,
//                 'designer' => $designer
//             ]);


//             Log::debug('Cart item created');
//         }
//     }








//     protected function saveItemToCookies(
//         int $productId,
//         int $quantity,
//         $price,
//         $optionIds,
//         ?string $attachmentPath = null,
//         ?string $attachmentFileName = null,
//         bool $designer = false
//     ): void {
//         // Normalize option IDs
//         if (is_string($optionIds)) {
//             $decoded = json_decode($optionIds, true);
//             $optionIds = is_array($decoded) ? $decoded : [];
//         } elseif (!is_array($optionIds)) {
//             $optionIds = [];
//         }

//         ksort($optionIds);
//         $normalizedOptionIds = array_map('strval', $optionIds);
//         $encodedOptionIds = json_encode($normalizedOptionIds);

//         $cartItems = $this->getCartItemsFromCookies();
//         $itemKey = $productId . '_' . $encodedOptionIds;

//         if (isset($cartItems[$itemKey])) {
//             $cartItems[$itemKey]['quantity'] += $quantity;

//             // Update attachment if new one is provided
//             if ($attachmentPath !== null) {
//                 $cartItems[$itemKey]['attachment_path'] = $attachmentPath;
//                 $cartItems[$itemKey]['attachment_name'] = $attachmentFileName;
//             }
//         } else {
//             $cartItems[$itemKey] = [
//                 'product_id' => $productId,
//                 'quantity' => $quantity,
//                 'price' => $price,
//                 'option_ids' => $normalizedOptionIds,
//                 'attachment_path' => $attachmentPath,
//                 'attachment_name' => $attachmentFileName, // 👈 Added
//                 'designer' => $designer
//             ];
//         }

//         Cookie::queue(self::COOKIE_NAME, json_encode($cartItems), self::COOKIE_LIFETIME);
//     }





//     protected function removeItemFromDatabase(int $productId, array $optionIds): void
//     {
//         $userId = Auth::id();

//         $optionIds = array_map('strval', $optionIds);
//         ksort($optionIds);

//         $cartItems = CartItem::where('user_id', $userId)
//             ->where('product_id', $productId)
//             ->get();

//         foreach ($cartItems as $cartItem) {
//             $dbOptionIdsRaw = $cartItem->variation_type_option_ids;
//             $dbOptionIds = [];

//             if (is_string($dbOptionIdsRaw)) {
//                 $decoded = json_decode($dbOptionIdsRaw, true);
//                 if (is_array($decoded) && array_is_list($decoded)) {
//                     // Skip array-style format like ["1","3"]
//                     Log::warning('Skipping item with list-style variation_type_option_ids', [
//                         'cart_item_id' => $cartItem->id,
//                         'variation_type_option_ids' => $decoded,
//                     ]);
//                     continue;
//                 }
//                 $dbOptionIds = $decoded;
//             } elseif (is_array($dbOptionIdsRaw)) {
//                 $dbOptionIds = $dbOptionIdsRaw;
//             }

//             if (is_array($dbOptionIds)) {
//                 ksort($dbOptionIds);
//                 ksort($optionIds);

//                 if ($dbOptionIds === $optionIds) {
//                     Log::info('Deleting cart item', ['cart_item_id' => $cartItem->id]);
//                     $cartItem->delete();
//                 } else {
//                     Log::info('Option IDs do not match', [
//                         'cart_item_id' => $cartItem->id,
//                         'dbOptionIds_sorted' => $dbOptionIds,
//                         'optionIds_sorted' => $optionIds,
//                     ]);
//                 }
//             } else {
//                 Log::warning('variation_type_option_ids is not array after json_decode', [
//                     'cart_item_id' => $cartItem->id,
//                     'variation_type_option_ids' => $dbOptionIdsRaw,
//                 ]);
//             }
//         }
//     }



//     protected function removeItemFromCookies(int $productId, array $optionIds): void
//     {
//         $cartItems = $this->getCartItemsFromCookies();

//         ksort($optionIds);
//         $encodedOptionIds = json_encode($optionIds);

//         $itemKey = $productId . '_' . $encodedOptionIds;

//         if (isset($cartItems[$itemKey])) {
//             unset($cartItems[$itemKey]);
//             if (empty($cartItems)) {
//                 Cookie::queue(Cookie::forget(self::COOKIE_NAME));
//             } else {
//                 Cookie::queue(self::COOKIE_NAME, json_encode($cartItems), self::COOKIE_LIFETIME);
//             }
//         }
//     }



//     protected function getCartItemsFromDatabase(): array
//     {
//         $userId = Auth::id();

//         $cartItems = CartItem::where('user_id', $userId)
//             ->paginate(50)
//             ->map(function ($cartItem) {
//                 $normalizedOptionIds = $this->normalizeOptionIds($cartItem->variation_type_option_ids);

//                 Log::debug('Normalized option_ids for cart item', [
//                     'cart_item_id' => $cartItem->id,
//                     'raw_option_ids' => $cartItem->variation_type_option_ids,
//                     'normalized_option_ids' => $normalizedOptionIds,
//                 ]);

//                 return [
//                     'id' => $cartItem->id,
//                     'product_id' => $cartItem->product_id,
//                     'quantity' => $cartItem->quantity,
//                     'option_ids' => $normalizedOptionIds,
//                     'price' => $cartItem->price,
//                     'attachment_path' => $cartItem->attachment_path,
//                     'attachment_name' => $cartItem->attachment_name,
//                     'designer' => $cartItem->designer
//                 ];
//             })->toArray();

//         return Auth::check() ? $cartItems : [];
//     }



//     public function getCartItemsFromCookies(): array
//     {
//         $cookieValue = request()->cookie(self::COOKIE_NAME);
//         Log::debug('Fetching cart cookie value', ['cookie_name' => self::COOKIE_NAME, 'cookie_value' => $cookieValue]);

//         if (!$cookieValue) {
//             Log::debug('No cart cookie found, returning empty array');
//             return [];
//         }

//         $cartItems = json_decode($cookieValue, true);

//         if (!is_array($cartItems)) {
//             return [];
//         }


//         $normalizedCartItems = [];
//         foreach ($cartItems as $key => $item) {
//             $normalizedCartItems[$key] = [
//                 'product_id' => $item['product_id'] ?? null,
//                 'quantity' => $item['quantity'] ?? 0,
//                 'price' => $item['price'] ?? 0,
//                 'option_ids' => $item['option_ids'] ?? [],
//                 'attachment_path' => $item['attachment_path'] ?? null,
//                 'attachment_name' => $item['attachment_name'] ?? null,
//                 'designer' => $item['designer'] ?? false
//             ];
//         }

//         Log::debug('Normalized cart items', ['normalized_cart_items' => $normalizedCartItems]);

//         return $normalizedCartItems;
//     }



//     public function moveCartItemsToDatabase($userId): void
//     {
//         $cartItems = $this->getCartItemsFromCookies();

//         foreach ($cartItems as $cartItem) {
//             // Normalize option_ids order to associative array like {"3":"5","4":"7","5":"9"}
//             $optionIds = $cartItem['option_ids'] ?? [];

//             // Use your normalizeOptionIds method or inline logic here:
//             $optionIds = $this->normalizeOptionIds($optionIds);

//             // JSON encode associative array
//             $optionIdsJson = json_encode($optionIds);

//             $existingItem = CartItem::where('user_id', $userId)
//                 ->where('product_id', $cartItem['product_id'])
//                 ->where('variation_type_option_ids', $optionIdsJson)
//                 ->first();

//             if ($existingItem) {
//                 $updateData = [
//                     'quantity' => $existingItem->quantity + $cartItem['quantity'],
//                 ];

//                 // Update attachments only if provided in cookie data
//                 if (isset($cartItem['attachment_path'])) {
//                     $updateData['attachment_path'] = $cartItem['attachment_path'];
//                 }
//                 if (isset($cartItem['attachment_name'])) {
//                     $updateData['attachment_name'] = $cartItem['attachment_name'];
//                 }

//                 $existingItem->update($updateData);
//             } else {
//                 CartItem::create([
//                     'user_id' => $userId,
//                      'item_type' => 'product',
//                     'product_id' => $cartItem['product_id'],
//                     'quantity' => $cartItem['quantity'],
//                     'price' => $cartItem['price'],
//                     'variation_type_option_ids' => $optionIdsJson,
//                     'attachment_path' => $cartItem['attachment_path'] ?? null,
//                     'attachment_name' => $cartItem['attachment_name'] ?? null,
//                     'designer' => $cartItem['designer'] ?? false
//                 ]);
//             }
//         }

//         // Remove the cookie after moving cart items
//         Cookie::queue(Cookie::forget(self::COOKIE_NAME));
//     }



//     public function getCartItemsGrouped()
//     {
//         $cartItems = $this->getCartItems();

//         $grouped = collect($cartItems)
//             ->groupBy(fn($item) => $item['user']['id'])
//             ->map(function ($items, $userId) {
//                 $firstItem = $items->first();

//                 $vendor = $firstItem['product']['vendor'] ?? null;

//                 return [
//                     'user' => $firstItem['user'],
//                     'vendor' => $vendor,
//                     'items' => $items->toArray(),
//                     'totalQuantity' => $items->sum('quantity'),
//                     'totalPrice' => $items->sum(fn($item) => $item['price'] * $item['quantity']),
//                 ];
//             })
//             ->toArray();

//         // dump and die here to inspect grouped cart items with vendor info

//         return $grouped; // unreachable after dd, but good practice
//     }




//     protected function normalizeOptionIds($optionIds): array
//     {
//         if (is_string($optionIds)) {
//             $decoded = json_decode($optionIds, true);
//             $optionIds = is_array($decoded) ? $decoded : [];
//         }

//         if (!is_array($optionIds)) {
//             $optionIds = [];
//         }

//         // Convert indexed array ["1", "3"] → associative {"1": "1", "2": "3"}
//         if (array_is_list($optionIds)) {
//             $optionIds = collect($optionIds)
//                 ->values()
//                 ->mapWithKeys(function ($value, $index) {
//                     return [strval($index + 1) => strval($value)];
//                 })->toArray();
//         } else {
//             // Ensure all keys and values are strings
//             $optionIds = collect($optionIds)->mapWithKeys(function ($value, $key) {
//                 return [strval($key) => strval($value)];
//             })->toArray();
//         }

//         ksort($optionIds); // Consistent key order

//         return $optionIds;
//     }
// }

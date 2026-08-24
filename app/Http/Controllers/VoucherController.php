<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatusEnum;
use App\Models\GiftCardTemplate;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Stripe;

class VoucherController extends Controller
{
    // ──────────────────────────────────────────────────────────────
    // GIFT CARD SHOP
    // ──────────────────────────────────────────────────────────────

    /**
     * Show all purchasable gift card templates.
     */
    public function shop()
    {
        $giftCards = GiftCardTemplate::where('active', true)
            ->orderBy('sort_order')
            ->orderBy('amount')
            ->get()
            ->map(fn($t) => [
                'id'          => $t->id,
                'title'       => $t->title,
                'description' => $t->description,
                'amount'      => $t->amount,
                'image_url'   => $t->getImageUrl(),
            ]);

        return Inertia::render('GiftVoucher/GiftVoucherShop', [
            'giftCards' => $giftCards,
        ]);
    }

    /**
     * Add a gift card to the cart (no Stripe yet — goes through normal cart checkout).
     */
    public function addToCart(Request $request, CartService $cartService)
    {
        $request->validate([
            'gift_card_template_id' => 'required|exists:gift_card_templates,id',
            'gifted_to_email'       => 'nullable|email',
        ]);

        $template = GiftCardTemplate::where('id', $request->gift_card_template_id)
            ->where('active', true)
            ->firstOrFail();

        $cartService->addGiftCardToCart($template, $request->gifted_to_email);

        return back()->with('success', 'Gift card added to your cart.');
    }

    /**
     * Direct Stripe purchase (bypasses cart — used from gift card shop "Buy Now").
     */
        public function purchase(Request $request)
        {
            $request->validate([
                'gift_card_template_id' => 'required|exists:gift_card_templates,id',
                'gifted_to_email'       => 'nullable|email',
                'quantity'              => 'integer|min:1|max:10',
            ]);

            $template = GiftCardTemplate::where('id', $request->gift_card_template_id)
                ->where('active', true)
                ->firstOrFail();

            $qty  = $request->input('quantity', 1);
            $user = Auth::user();

            Stripe::setApiKey(config('app.stripe_secret_key'));

            DB::beginTransaction();
            try {
                $vouchers = collect(range(1, $qty))->map(fn() => Voucher::create([
                    'code'                  => strtoupper(Str::random(12)),
                    'type'                  => 'gift',
                    'amount'                => $template->amount,
                    'remaining_amount'      => $template->amount,
                    'discount_type'         => 'fixed',
                    'purchased_by'          => $user->id,
                    'gifted_to_email'       => $request->gifted_to_email,
                    'gift_card_template_id' => $template->id,
                    'active'                => false,
                    'expires_at'            => now()->addYear(),
                ]));

                $voucherIds = $vouchers->pluck('id')->implode(',');

                $session = StripeSession::create([
                    'customer_email' => $user->email,
                    'line_items' => [[
                        'price_data' => [
                            'currency'     => config('app.currency', 'aud'),
                            'product_data' => ['name' => $template->title],
                            'unit_amount'  => intval($template->amount * 100),
                        ],
                        'quantity' => $qty,
                    ]],
                    'mode'        => 'payment',
                    'success_url' => route('stripe.success') . '?session_id={CHECKOUT_SESSION_ID}',
                    'cancel_url'  => route('gift-voucher.shop'),
                    'metadata'    => [
                        'voucher_ids'            => $voucherIds,
                        'gift_card_template_id'  => $template->id,
                        'purchased_by'           => $user->id,
                        'gifted_to_email'        => $request->gifted_to_email ?? '',
                        'quantity'               => $qty,
                    ],
                ]);

                $vouchers->each(fn($v) => $v->update(['stripe_session_id' => $session->id]));

                DB::commit();
                return Inertia::location($session->url);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Gift card purchase failed: ' . $e->getMessage());
                return back()->withErrors('Purchase failed. Please try again.');
            }
        }




    /**
     * Stripe success — activate vouchers after payment confirmed.
     */
    public function success(Request $request)
    {
        $sessionId = $request->get('session_id');
        if (! $sessionId) {
            return redirect()->route('gift-voucher.shop')->with('error', 'No session ID.');
        }

        Stripe::setApiKey(config('app.stripe_secret_key'));
        $session = StripeSession::retrieve($sessionId);

        if ($session->payment_status !== 'paid') {
            return redirect()->route('gift-voucher.shop')->with('error', 'Payment not completed.');
        }

        $vouchers = Voucher::where('stripe_session_id', $sessionId)->get();

        if ($vouchers->isEmpty()) abort(404, 'Vouchers not found.');
        if ($vouchers->first()->purchased_by !== Auth::id()) abort(403);

        DB::transaction(fn() => $vouchers->each(
            fn($v) => $v->active || $v->update(['active' => true])
        ));

        return Inertia::render('GiftVoucher/GiftVoucherSuccess', [
            'vouchers' => $vouchers->map(fn($v) => [
                'code'             => $v->code,
                'amount'           => $v->amount,
                'remaining_amount' => $v->remaining_amount,
                'expires_at'       => $v->expires_at?->toDateString(),
                'gifted_to_email'  => $v->gifted_to_email,
            ]),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // MY VOUCHERS
    // ──────────────────────────────────────────────────────────────

    public function index()
    {
        $user = Auth::user();

        $purchased = Voucher::where('purchased_by', $user->id)
            ->where('type', 'gift')
            ->where('hidden', false)
            ->with(['usages', 'giftCardProduct'])
            ->latest()
            ->get();

        $received = Voucher::where(function ($q) use ($user) {
            $q->where('assigned_to', $user->id)
                ->orWhere('gifted_to_email', $user->email);
        })
            ->where('type', 'gift')
            ->where('active', true)
            ->latest()
            ->get();

        return Inertia::render('Vouchers/Index', [
            'purchased'     => $purchased,
            'received'      => $received,
            'voucher'       => null,
            'error'         => null,
            'referral_code' => $user->referral_code,
        ]);
    }
    public function hide(Voucher $voucher)
    {
        abort_unless(
            $voucher->purchased_by === Auth::id()
                || $voucher->assigned_to === Auth::id()
                || $voucher->gifted_to_email === Auth::user()->email,
            403
        );

        $voucher->update(['hidden' => true]);

        return back();
    }
    public function validateForUser(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        $voucher  = Voucher::where('code', $request->code)->where('active', true)->first();
        $user     = Auth::user();
        $purchased = Voucher::where('purchased_by', $user->id)->where('type', 'gift')->with('usages')->latest()->get();
        $received  = Voucher::where(function ($q) use ($user) {
            $q->where('assigned_to', $user->id)->orWhere('gifted_to_email', $user->email);
        })->where('type', 'gift')->where('active', true)->latest()->get();

        return Inertia::render('Vouchers/Index', [
            'purchased'     => $purchased,
            'received'      => $received,
            'voucher'       => $voucher,
            'error'         => $voucher ? null : 'Voucher not found or inactive.',
            'referral_code' => $user->referral_code,
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // VALIDATE FOR CART (fetch call from frontend)
    // ──────────────────────────────────────────────────────────────

    public function validateAndApplyCode(Request $request)
    {
        $request->validate([
            'code'        => 'required|string',
            'order_total' => 'nullable|numeric|min:0',
        ]);

        $voucher = Voucher::where('code', $request->code)
            ->where('active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();

        if (! $voucher) {
            return response()->json(['error' => 'Invalid or expired code.'], 404);
        }

        if ($voucher->type === 'promo' && auth()->check()) {
            $alreadyUsed = VoucherUsage::where('voucher_id', $voucher->id)
                ->where('user_id', auth()->id())
                ->exists();

            if ($alreadyUsed) {
                return response()->json(['error' => 'You have already used this code.'], 400);
            }
        }

        if (! $voucher->isUsable()) {
            return response()->json(['error' => 'This voucher has no remaining balance or has reached its usage limit.'], 400);
        }

        $orderTotal     = floatval($request->input('order_total', 0));
        $discountAmount = $voucher->discountFor($orderTotal);

        return response()->json([
            'id'               => $voucher->id,
            'type'             => $voucher->type,
            'discount_type'    => $voucher->discount_type,
            'amount'           => $voucher->amount,
            'remaining_amount' => $voucher->remaining_amount,
            'discount_amount'  => $discountAmount,
            'message'          => 'Voucher validated.',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Enums\RolesEnum;
use App\Enums\VendorStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): \Inertia\Response
    {
        return Inertia::render('Auth/LoginPage', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

 public function store(LoginRequest $request, CartService $cartService): RedirectResponse|\Illuminate\Http\JsonResponse
{
    $request->authenticate();
    $request->session()->regenerate();

    $user = Auth::user();
    $cartService->moveCartItemsToDatabase($user->id);

    $redirectUrl = route('home', absolute: false);

    if ($user->hasRole(RolesEnum::Admin)) {
        $redirectUrl = route('admin.dashboard');
    } elseif ($user->hasRole(RolesEnum::Vendor)) {
        $vendor = $user->vendor;
        if (!$vendor) {
            $redirectUrl = route('home');
        } elseif ($vendor->status === VendorStatusEnum::Approved->value) {
            $redirectUrl = route('home');
        } else {
            $redirectUrl = route('home');
        }
    } else {
        $redirectUrl = redirect()->intended(route('home', absolute: false))->getTargetUrl();
    }

    if ($request->wantsJson()) {
        return response()->json(['redirect' => $redirectUrl]);
    }

    return redirect($redirectUrl);
}

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}

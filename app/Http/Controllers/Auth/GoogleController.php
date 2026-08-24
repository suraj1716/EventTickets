<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Contracts\Factory as SocialiteFactory;

class GoogleController extends Controller
{
    public function redirectToGoogle(SocialiteFactory $socialite)
    {
        /** @var \Laravel\Socialite\Two\GoogleProvider $google */
        $google = $socialite->driver('google');

        return $google
            ->scopes([
                'openid',
                'profile',
                'email',
                // 'https://www.googleapis.com/auth/calendar.events',
            ])
            // ->with([
            //     'access_type' => 'offline',
            //     'prompt' => 'consent'
            // ])
            ->redirect();
    }


    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            $user = User::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name'        => $googleUser->getName(),
                    'google_id'   => $googleUser->getId(),
                    'avatar'      => $googleUser->getAvatar(),
                    'given_name'  => $googleUser->user['given_name'] ?? null,
                    'family_name' => $googleUser->user['family_name'] ?? null,
                    'locale'      => $googleUser->user['locale'] ?? null,

                     'email_verified_at' => now(),
                    // 'google_access_token'  => $googleUser->token,
                    // 'google_refresh_token' => $googleUser->refreshToken ?? null,
                    // 'token_expires_at'     => now()->addSeconds($googleUser->expiresIn),
                ]
            );
            Auth::login($user);
            // Optionally, save the access token and refresh token if needed
            // $user = Auth::user();
            // $user->google_token = json_encode([
            //     'access_token' => $googleUser->token,
            //     'refresh_token' => $googleUser->refreshToken ?? null,
            //     'expires_in' => $googleUser->expiresIn,
            //     'created' => time(), // VERY important for refresh logic
            //     'token_type' => 'Bearer',
            //     'scope' => 'https://www.googleapis.com/auth/calendar',
            // ]);

            // $user->save();

            return redirect()->intended('/');
        } catch (\Exception $e) {
            Log::error('Google OAuth callback failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect('/login')->withErrors('Unable to login with Google.');
        }
    }
}

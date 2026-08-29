<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventWatchlist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\VerifyEventWatchlist;

class EventWatchlistController extends Controller
{
    /**
     * Join the event watchlist.
     *
     * The email is NOT counted until the user verifies ownership
     * through the verification email.
     */
    public function store(Request $request, Event $event)
    {
        abort_unless($event->watchlist_enabled, 404);

        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $email = strtolower(trim($data['email']));

        /*
         * Already verified?
         */
        $existing = EventWatchlist::where('event_id', $event->id)
            ->where('email', $email)
            ->first();

        if ($existing?->verified_at) {
            return redirect()
                ->back()
                ->with('success', "You're already on the watchlist.");
        }

        /*
         * Generate a new verification token.
         *
         * We only store the SHA-256 hash in the database.
         */
        $token = Str::random(64);

        $watchlist = $existing ?? new EventWatchlist();

        $watchlist->event_id = $event->id;
        $watchlist->email = $email;
        $watchlist->user_id = $request->user()?->id;
        $watchlist->verified_at = null;
        $watchlist->verification_token_hash = hash('sha256', $token);
        $watchlist->verification_expires_at = now()->addHours(24);
        $watchlist->notified = false;
        $watchlist->notified_at = null;
        $watchlist->save();

        /*
         * Send verification email.
         */
        Mail::to($email)->send(
            new VerifyEventWatchlist($watchlist, $token)
        );

        return redirect()
            ->back()
            ->with(
                'success',
                'Check your email to confirm your watchlist subscription.'
            );
    }

    /**
     * Verify ownership of the email address.
     */
    public function verify(string $token)
    {
        $hash = hash('sha256', $token);

       $watchlist = EventWatchlist::with('event.media')
    ->where(
        'verification_token_hash',
        $hash
    )
    ->first();

        if (! $watchlist) {
            abort(404, 'This verification link is invalid.');
        }

        if ($watchlist->verified_at) {
            return redirect()
                ->route('events.coming-soon')
                ->with(
                    'success',
                    "Your watchlist subscription is already confirmed."
                );
        }

        if (
            ! $watchlist->verification_expires_at ||
            $watchlist->verification_expires_at->isPast()
        ) {
            return redirect()
                ->route('events.coming-soon')
                ->with(
                    'error',
                    'This verification link has expired. Please join the watchlist again.'
                );
        }

        /*
         * Confirm the email.
         */
        $watchlist->update([
            'verified_at' => now(),
            'verification_token_hash' => null,
            'verification_expires_at' => null,
        ]);

        return redirect()
            ->route('events.coming-soon')
            ->with(
                'success',
                "You're confirmed! We'll email you when {$watchlist->event->name} is available."
            );
    }

    public function destroy(Request $request, Event $event)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        EventWatchlist::where('event_id', $event->id)
            ->where('email', strtolower(trim($data['email'])))
            ->delete();

        return redirect()
            ->back()
            ->with(
                'success',
                "You've been removed from the watchlist."
            );
    }
}

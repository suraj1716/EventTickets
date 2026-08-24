<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;

class EventWatchlistController extends Controller
{
    // Called via router.post() from Events/Show.tsx. Redirecting back
    // (rather than returning JSON) re-renders the current page's props —
    // since EventSearchController::show() calls loadCount('watchlist'),
    // the buyer sees the updated "X watching" count automatically, no
    // separate polling endpoint needed.
    public function store(Request $request, Event $event)
    {
        abort_unless($event->watchlist_enabled, 404);

        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $event->watchlist()->firstOrCreate(
            ['email' => $data['email']],
            ['user_id' => $request->user()?->id]
        );

        return redirect()->back()->with('success', "You're on the list — we'll email you when it's confirmed.");
    }

    public function destroy(Request $request, Event $event)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $event->watchlist()->where('email', $data['email'])->delete();

        return redirect()->back()->with('success', "You've been removed from the watchlist.");
    }
}

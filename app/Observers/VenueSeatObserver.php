<?php

namespace App\Observers;

use App\Models\Venue;
use App\Models\VenueSeat;

class VenueSeatObserver
{
    public function saved(VenueSeat $seat): void
    {
        Venue::forgetCachedLayout($seat->venue_id);
    }

    public function deleted(VenueSeat $seat): void
    {
        Venue::forgetCachedLayout($seat->venue_id);
    }
}

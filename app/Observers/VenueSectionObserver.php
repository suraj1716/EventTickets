<?php

namespace App\Observers;

use App\Models\Venue;
use App\Models\VenueSection;

class VenueSectionObserver
{
    public function saved(VenueSection $section): void
    {
        Venue::forgetCachedLayout($section->venue_id);
    }

    public function deleted(VenueSection $section): void
    {
        Venue::forgetCachedLayout($section->venue_id);
    }
}

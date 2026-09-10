<?php

namespace App\Observers;

use App\Models\TicketTier;

class TicketTierObserver
{
    public function saved(TicketTier $tier): void
    {
        TicketTier::forgetCachedTierList($tier->event_leg_id);
    }

    public function deleted(TicketTier $tier): void
    {
        TicketTier::forgetCachedTierList($tier->event_leg_id);
    }
}

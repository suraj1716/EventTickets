<?php

namespace App\Support;

class TimeSlotParser
{
    /**
     * Extracts the START time from a time_slot string in any known format
     * and returns minutes since midnight, for sorting purposes only.
     * Handles: "9:00 am - 9:30 am", "12:00 pm - 12:30 pm", "15:00"
     */
    public static function toMinutes(?string $timeSlot): ?int
    {
        if (! $timeSlot) return null;

        // Take just the start time if it's a range
        $start = trim(explode('-', $timeSlot)[0]);

        // Try 24-hour format first: "15:00"
        if (preg_match('/^(\d{1,2}):(\d{2})$/', $start, $m)) {
            return ((int) $m[1]) * 60 + (int) $m[2];
        }

        // Try 12-hour format: "9:00 am", "12:00 pm"
        if (preg_match('/^(\d{1,2}):(\d{2})\s*(am|pm)$/i', $start, $m)) {
            $hour = (int) $m[1];
            $minute = (int) $m[2];
            $meridiem = strtolower($m[3]);

            if ($meridiem === 'pm' && $hour !== 12) $hour += 12;
            if ($meridiem === 'am' && $hour === 12) $hour = 0;

            return $hour * 60 + $minute;
        }

        return null; // unrecognized format — falls back to null, sorts last
    }
}

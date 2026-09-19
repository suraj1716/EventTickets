<?php

namespace App\Enums;

/**
 * Sponsor tier for event sponsors.
 *
 * Stored as a plain string column, not a DB enum — adding a tier later is
 * then a code change instead of an ALTER TYPE on Postgres.
 *
 * rank() drives display order (and logo size on the buyer-side section).
 */
enum SponsorTierEnum: string
{
    case PLATINUM = 'platinum';
    case GOLD     = 'gold';
    case OTHER    = 'other';

    public function label(): string
    {
        return match ($this) {
            self::PLATINUM => 'Platinum',
            self::GOLD     => 'Gold',
            self::OTHER    => 'Partners',
        };
    }

    public function rank(): int
    {
        return match ($this) {
            self::PLATINUM => 1,
            self::GOLD     => 2,
            self::OTHER    => 3,
        };
    }

    public static function labels(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn (self $t) => [$t->value => $t->label()])
            ->all();
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * SQL CASE fragment for ordering by rank — used by Event::sponsors()
     * so the relation comes back already in display order and the frontend
     * never has to sort.
     */
    public static function orderByRankSql(string $column = 'tier'): string
    {
        $whens = collect(self::cases())
            ->map(fn (self $t) => "WHEN '{$t->value}' THEN {$t->rank()}")
            ->implode(' ');

        return "CASE {$column} {$whens} ELSE 99 END";
    }
}

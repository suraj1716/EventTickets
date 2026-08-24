<?php

namespace App\Enums;

enum ProductHighlightEnum: string
{
    case Trending = 'trending';
    case Sale = 'sale';
    case Hot = 'hot';
    case New = 'new';

    public static function labels(): array
    {
        return [
            self::Trending->value => 'Trending',
            self::Sale->value => 'Sale',
            self::Hot->value => 'Hot',
            self::New->value => 'New',
        ];
    }

    public static function colors(): array
    {
        return [
            self::Trending->value => 'info',
            self::Sale->value => 'success',
            self::Hot->value => 'danger',
            self::New->value => 'warning',
        ];
    }
}

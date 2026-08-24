<?php

namespace App\Enums;

enum VendorType: string
{
    case APPOINTMENT = 'appointment';
    case ECOMMERCE = 'ecommerce';

    public static function labels(): array
    {
        return [
            self::APPOINTMENT->value => 'Appointment',
            self::ECOMMERCE->value => 'E-commerce',
        ];
    }
}

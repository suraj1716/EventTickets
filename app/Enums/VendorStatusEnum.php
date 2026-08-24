<?php

namespace App\Enums;

enum VendorStatusEnum: string
{
    case Pending = 'active';

    case Approved = 'approved';
    case Rejected = 'rejected';


public function label(): string
{
    return match($this) {
        self::Pending => __('Pending'),
        self::Approved => __('Approved'),
        self::Rejected => __('Rejected'),
    };
}

    public static function labels():array
    {
        return[
            self::Pending->value=>__('Pending'),
            self::Approved->value=>__('Approved'),
            self::Rejected->value=>__('Rejected'),


        ];
    }

    public static function colors():array
    {
        return [
            'grey'=>self::Pending->value,
            'success'=>self::Approved->value,
            'danger'=>self::Rejected->value,
        ];
    }

}

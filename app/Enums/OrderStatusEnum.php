<?php

namespace App\Enums;

enum OrderStatusEnum: string
{
    case Draft='draft';
    case Paid='paid';
     case PaidFulfillmentFailed = 'paid_fulfillment_failed';
    // case Shipped='shipped';
    case Delivered='delivered';
    case Cancelled='cancelled';
        case Refunded = 'refunded';


    public static function labels()
    {
        return[
            self::Draft->value=>__('Draft'),
            self::Delivered->value=>__('Delivered'),
            self::Cancelled->value=>__('Cancelled'),
            // self::Shipped->value=>__('Shipped'),
             self::Refunded->value => __('Refunded'),
            self::Paid->value=>__('Paid'),
        ];
    }
}

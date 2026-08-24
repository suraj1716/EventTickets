<?php
namespace App\Enums;

enum ContactReasonEnum: string
{
    case Inquiry = 'inquiry';
    case Other = 'other';
    case GettingQuote = 'getting_quote';
    case Complain = 'complain';
}

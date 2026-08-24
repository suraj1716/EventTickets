<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Filament\Notifications\Notification as FilamentNotification;
use App\Models\Order;

class NewOrderNotification extends Notification
{
    use Queueable;

    public $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    // Decide channels, you can use 'database' or 'broadcast' for Filament UI
    public function via($notifiable)
    {
        return ['database'];
    }

    public function toArray($notifiable)
    {
       return [
    'order_id' => $this->order->id,
    'title' => 'New Order Received',
    'message' => "Order #{$this->order->id} has been placed.",
    'url' => route('filament.admin.resources.orders.view', ['record' => $this->order->id]),
];
    }
}

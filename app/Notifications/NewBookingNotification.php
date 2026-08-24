<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Filament\Notifications\Notification as FilamentNotification;
use App\Models\Booking; // Assuming you have a Booking model

class NewBookingNotification extends Notification
{
    use Queueable;

    public $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toArray($notifiable)
    {
        return [
            'booking_id' => $this->booking->id,
            'title' => 'New Booking Received',
            'message' => "Booking #{$this->booking->id} has been scheduled.",
           route('filament.admin.resources.bookings.view', ['record' => $this->booking->id])

        ];
    }
}

<?php

namespace App\Mail;

use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class BrevoApiTransport extends AbstractTransport
{
    protected string $apiKey;

    public function __construct(string $apiKey)
    {
        parent::__construct();
        $this->apiKey = $apiKey;
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $to = array_map(fn($addr) => [
            'email' => $addr->getAddress(),
            'name'  => $addr->getName() ?: null,
        ], $email->getTo());

        $fromAddr = $email->getFrom()[0] ?? null;

        $payload = [
            'sender' => [
                'email' => $fromAddr?->getAddress() ?? config('mail.from.address'),
                'name'  => $fromAddr?->getName() ?? config('mail.from.name'),
            ],
            'to' => $to,
            'subject' => $email->getSubject(),
            'htmlContent' => $email->getHtmlBody() ?? $email->getTextBody(),
        ];

        $client = new Client();

        try {
            $response = $client->post('https://api.brevo.com/v3/smtp/email', [
                'headers' => [
                    'api-key'      => $this->apiKey,
                    'Content-Type' => 'application/json',
                    'Accept'       => 'application/json',
                ],
                'json' => $payload,
                'timeout' => 15,
            ]);

            Log::info('Brevo API mail sent', ['status' => $response->getStatusCode()]);
        } catch (\Exception $e) {
            Log::error('Brevo API mail failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function __toString(): string
    {
        return 'brevo+api';
    }
}

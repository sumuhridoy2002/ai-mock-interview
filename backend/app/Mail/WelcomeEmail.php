<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to '.config('app.name'),
        );
    }

    public function content(): Content
    {
        $appUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');

        return new Content(
            view: 'emails.welcome',
            with: [
                'userName' => $this->user->name,
                'dashboardUrl' => $appUrl.'/dashboard',
                'resumeUrl' => $appUrl.'/resume/upload',
                'setupUrl' => $appUrl.'/interview/setup',
            ],
        );
    }
}

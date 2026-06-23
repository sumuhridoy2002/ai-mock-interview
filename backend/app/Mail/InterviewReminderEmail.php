<?php

namespace App\Mail;

use App\Models\Interview;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InterviewReminderEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Interview $interview) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Interview in 10 minutes — '.$this->interview->job_title,
        );
    }

    public function content(): Content
    {
        $appUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');

        return new Content(
            view: 'emails.interview-reminder',
            with: [
                'jobTitle' => $this->interview->job_title,
                'scheduledAt' => $this->interview->scheduled_at?->timezone(config('app.timezone'))->format('D, M j, Y g:i A T'),
                'message' => $this->interview->alarm_message,
                'dashboardUrl' => $appUrl.'/dashboard',
                'setupUrl' => $appUrl.'/interview/setup',
            ],
        );
    }
}

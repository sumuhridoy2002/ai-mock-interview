<?php

namespace App\Jobs;

use App\Mail\InterviewReminderEmail;
use App\Models\Interview;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendInterviewReminderJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $interviewId) {}

    public function handle(): void
    {
        $interview = Interview::with('user')->find($this->interviewId);

        if (! $interview || ! $interview->scheduled_at || $interview->reminder_sent_at) {
            return;
        }

        if ($interview->status === 'completed' || ! $interview->user) {
            return;
        }

        Mail::to($interview->user->email)->send(new InterviewReminderEmail($interview));

        $interview->update(['reminder_sent_at' => now()]);
    }
}

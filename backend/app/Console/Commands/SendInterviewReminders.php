<?php

namespace App\Console\Commands;

use App\Jobs\SendInterviewReminderJob;
use App\Models\Interview;
use Illuminate\Console\Command;

class SendInterviewReminders extends Command
{
    protected $signature = 'interviews:send-reminders';

    protected $description = 'Dispatch email reminders for interviews starting in ~10 minutes';

    public function handle(): int
    {
        $interviews = Interview::query()
            ->whereNotNull('scheduled_at')
            ->whereNull('reminder_sent_at')
            ->whereNotIn('status', ['completed'])
            ->where('scheduled_at', '>', now())
            ->where('scheduled_at', '<=', now()->addMinutes(10))
            ->pluck('id');

        foreach ($interviews as $id) {
            SendInterviewReminderJob::dispatch($id);
        }

        $this->info('Dispatched '.$interviews->count().' interview reminder(s).');

        return self::SUCCESS;
    }
}

<?php

namespace Tests\Feature;

use App\Jobs\SendInterviewReminderJob;
use App\Jobs\SendWelcomeEmailJob;
use App\Mail\InterviewReminderEmail;
use App\Mail\WelcomeEmail;
use App\Models\Interview;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class EmailNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_dispatches_welcome_email_job(): void
    {
        Queue::fake();

        $this->postJson('/api/v1/register', [
            'name' => 'Test User',
            'email' => 'welcome@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        Queue::assertPushed(SendWelcomeEmailJob::class, function (SendWelcomeEmailJob $job) {
            return $job->user->email === 'welcome@example.com';
        });
    }

    public function test_welcome_email_job_sends_mail(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        (new SendWelcomeEmailJob($user))->handle();

        Mail::assertSent(WelcomeEmail::class, function (WelcomeEmail $mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    public function test_interview_reminder_job_sends_mail_and_sets_reminder_sent_at(): void
    {
        Mail::fake();

        $interview = $this->createScheduledInterview(now()->addMinutes(10));

        (new SendInterviewReminderJob($interview->id))->handle();

        Mail::assertSent(InterviewReminderEmail::class, function (InterviewReminderEmail $mail) use ($interview) {
            return $mail->hasTo($interview->user->email);
        });

        $interview->refresh();
        $this->assertNotNull($interview->reminder_sent_at);
    }

    public function test_interview_reminder_job_is_idempotent(): void
    {
        Mail::fake();

        $interview = $this->createScheduledInterview(now()->addMinutes(10), [
            'reminder_sent_at' => now(),
        ]);

        (new SendInterviewReminderJob($interview->id))->handle();

        Mail::assertNothingSent();
    }

    public function test_send_reminders_command_dispatches_jobs_in_window(): void
    {
        Queue::fake();

        $inWindow = $this->createScheduledInterview(now()->addMinutes(10));
        $this->createScheduledInterview(now()->addHours(2));
        $this->createScheduledInterview(now()->addMinutes(10), [
            'reminder_sent_at' => now(),
        ]);
        $this->createScheduledInterview(now()->addMinutes(10), [
            'status' => 'completed',
        ]);

        $this->artisan('interviews:send-reminders')->assertSuccessful();

        Queue::assertPushed(SendInterviewReminderJob::class, 1);
        Queue::assertPushed(SendInterviewReminderJob::class, function (SendInterviewReminderJob $job) use ($inWindow) {
            return $job->interviewId === $inWindow->id;
        });
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createScheduledInterview(\DateTimeInterface $scheduledAt, array $overrides = []): Interview
    {
        $user = User::factory()->create();

        $resume = Resume::create([
            'user_id' => $user->id,
            'original_filename' => 'resume.pdf',
            'storage_path' => 'resumes/test.pdf',
            'mime_type' => 'application/pdf',
            'file_hash' => Str::random(40),
            'status' => 'parsed',
        ]);

        return Interview::create(array_merge([
            'user_id' => $user->id,
            'resume_id' => $resume->id,
            'job_title' => 'Software Engineer',
            'job_description' => 'Build and maintain web applications.',
            'experience_level' => 'mid',
            'interview_type' => 'mixed',
            'status' => 'setup',
            'scheduled_at' => $scheduledAt,
            'alarm_message' => 'Your interview starts soon.',
        ], $overrides));
    }
}

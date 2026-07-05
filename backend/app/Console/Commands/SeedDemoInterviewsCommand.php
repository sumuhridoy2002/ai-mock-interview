<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Demo\DemoInterviewSeederService;
use Illuminate\Console\Command;

class SeedDemoInterviewsCommand extends Command
{
    protected $signature = 'interviews:seed-demo
                            {--count=20 : Number of completed interviews to create}
                            {--email= : User email (defaults to test@example.com)}
                            {--fresh : Delete existing interviews for this user first}
                            {--no-pdf : Skip PDF generation (faster)}';

    protected $description = 'Seed realistic completed interviews with scores, snapshots, behavior, video, and reports';

    public function handle(DemoInterviewSeederService $seeder): int
    {
        $email = $this->option('email') ?: 'test@example.com';
        $count = max(1, min(100, (int) $this->option('count')));

        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->error("User not found: {$email}. Run php artisan db:seed first or register.");

            return self::FAILURE;
        }

        if ($this->option('fresh')) {
            $deleted = $seeder->purgeDemoInterviews($user);
            $this->warn("Removed {$deleted} existing interview(s) for {$email}.");
        }

        $this->info("Seeding {$count} demo interview(s) for {$user->name} ({$email})…");
        $this->line('Includes: questions, transcripts, scores, behavior, snapshot images, full-session video, reports.');

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $result = $seeder->seed($user, $count, ! $this->option('no-pdf'));

        $bar->finish();
        $this->newLine(2);

        $this->info("Done — created {$result['created']} interview(s).");
        $this->line('Open the dashboard and visit any completed interview result page.');
        $this->line('Video: GET /api/v1/interviews/{id}/recording');
        $this->line('Snapshots: result page → Visual timeline gallery');

        return self::SUCCESS;
    }
}

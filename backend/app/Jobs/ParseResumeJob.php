<?php

namespace App\Jobs;

use App\Models\Interview;
use App\Models\Resume;
use App\Services\Interview\AiGatewayService;
use App\Services\Interview\ResumeService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ParseResumeJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public Resume $resume) {}

    public function handle(AiGatewayService $aiGateway, ResumeService $resumeService): void
    {
        try {
            $profile = $aiGateway->analyzeCvFile($this->resume);

            $this->resume->update([
                'parsed_profile' => $profile,
                'status' => 'parsed',
            ]);

            $resumeService->cacheProfile($this->resume, $profile);
        } catch (\Throwable $e) {
            Log::error('ParseResumeJob failed', ['resume_id' => $this->resume->id, 'error' => $e->getMessage()]);
            $this->resume->update(['status' => 'failed']);
        }
    }
}

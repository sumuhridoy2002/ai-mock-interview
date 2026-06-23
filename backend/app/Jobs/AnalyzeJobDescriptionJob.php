<?php

namespace App\Jobs;

use App\Models\Interview;
use App\Services\Interview\AiGatewayService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AnalyzeJobDescriptionJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public Interview $interview) {}

    public function handle(AiGatewayService $aiGateway): void
    {
        $cacheKey = 'job_analysis:'.hash('sha256', $this->interview->job_title.$this->interview->job_description);

        $analysis = Cache::remember($cacheKey, config('ai.cache_ttl'), function () use ($aiGateway) {
            return $aiGateway->analyzeJob(
                $this->interview->job_title,
                $this->interview->job_description
            );
        });

        $this->interview->update(['job_analysis' => $analysis]);
    }
}

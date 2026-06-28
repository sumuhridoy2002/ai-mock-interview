<?php

namespace App\Jobs;

use App\Models\AnswerBehavior;
use App\Models\InterviewAnswer;
use App\Services\Interview\AiGatewayService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AnalyzeSnapshotsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 180;

    public function __construct(
        public InterviewAnswer $answer,
        public array $snapshotPaths,
        public string $question = '',
    ) {}

    public function handle(AiGatewayService $aiGateway): void
    {
        if ($this->answer->behavior) {
            return;
        }

        try {
            $result = $aiGateway->analyzeSnapshots($this->snapshotPaths, $this->question);

            AnswerBehavior::create([
                'interview_answer_id'  => $this->answer->id,
                'confidence'           => $result['confidence'] ?? 0,
                'nervousness'          => $result['nervousness'] ?? 0,
                'eye_contact_ratio'    => $result['eye_contact_ratio'] ?? 0,
                'head_stability'       => $result['head_stability'] ?? 0,
                'blink_rate'           => $result['blink_rate'] ?? 0,
                'emotion_distribution' => $result['emotion_distribution'] ?? [],
                'prosody'              => $result['prosody'] ?? [],
                'raw'                  => $result,
                'coaching_narrative'   => $result['coaching_narrative'] ?? null,
            ]);

            Log::info('Snapshot behaviour analysis stored', [
                'answer_id'       => $this->answer->id,
                'snapshots'       => count($this->snapshotPaths),
                'confidence'      => $result['confidence'] ?? null,
                'nervousness'     => $result['nervousness'] ?? null,
                'frames_analyzed' => $result['frames_analyzed'] ?? null,
            ]);
        } catch (\Throwable $e) {
            Log::error('AnalyzeSnapshotsJob failed', [
                'answer_id' => $this->answer->id,
                'error'     => $e->getMessage(),
            ]);

            throw $e;
        } finally {
            // Clean up stored snapshot files
            foreach ($this->snapshotPaths as $path) {
                try {
                    Storage::disk('local')->delete($path);
                } catch (\Throwable) {
                    // ignore
                }
            }
        }
    }
}

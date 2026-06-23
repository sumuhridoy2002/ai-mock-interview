<?php

namespace App\Events;

use App\Models\Interview;
use App\Models\InterviewAnswer;
use App\Models\InterviewScore;
use App\Models\InterviewSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnswerEvaluated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Interview $interview,
        public InterviewSession $session,
        public InterviewAnswer $answer,
        public InterviewScore $score,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('interview.'.$this->session->session_uuid),
        ];
    }

    public function broadcastAs(): string
    {
        return 'answer.evaluated';
    }

    public function broadcastWith(): array
    {
        return [
            'answer_id' => $this->answer->id,
            'score' => $this->score->overall_score,
            'relevance' => $this->score->relevance,
            'technical_accuracy' => $this->score->technical_accuracy,
            'communication' => $this->score->communication,
            'confidence' => $this->score->confidence,
            'completeness' => $this->score->completeness,
            'strengths' => $this->score->strengths,
            'weaknesses' => $this->score->weaknesses,
            'recommendations' => $this->score->recommendations,
        ];
    }
}

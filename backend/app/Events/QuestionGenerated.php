<?php

namespace App\Events;

use App\Models\Interview;
use App\Models\InterviewQuestion;
use App\Models\InterviewSession;
use App\Services\Interview\InterviewService;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuestionGenerated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Interview $interview,
        public InterviewSession $session,
        public InterviewQuestion $question,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('interview.'.$this->session->session_uuid),
        ];
    }

    public function broadcastAs(): string
    {
        return 'question.generated';
    }

    public function broadcastWith(): array
    {
        return [
            'question_id' => $this->question->id,
            'question' => $this->question->question_text,
            'sequence' => $this->question->sequence,
            'category' => $this->question->category,
            'max_questions' => app(InterviewService::class)->maxQuestions(),
        ];
    }
}

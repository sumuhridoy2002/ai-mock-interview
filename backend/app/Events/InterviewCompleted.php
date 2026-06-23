<?php

namespace App\Events;

use App\Models\Interview;
use App\Models\InterviewSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InterviewCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Interview $interview,
        public InterviewSession $session,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('interview.'.$this->session->session_uuid),
        ];
    }

    public function broadcastAs(): string
    {
        return 'interview.completed';
    }

    public function broadcastWith(): array
    {
        return [
            'interview_id' => $this->interview->id,
            'status' => $this->interview->status,
        ];
    }
}

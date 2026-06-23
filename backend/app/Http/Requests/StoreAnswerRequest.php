<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question_id' => ['required', 'integer', 'exists:interview_questions,id'],
            'idempotency_key' => ['required', 'string', 'max:255'],
            'transcript' => ['nullable', 'string', 'max:5000'],
            'audio' => ['nullable', 'file', 'max:20480', 'mimes:webm,wav,mp3,ogg,m4a,mp4'],
            'video' => ['nullable', 'file', 'max:51200', 'mimes:webm,mp4,ogg,m4a'],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:600'],
        ];
    }
}

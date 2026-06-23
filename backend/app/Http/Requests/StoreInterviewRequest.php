<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInterviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'resume_id'        => ['required', 'exists:resumes,id'],
            'job_title'        => ['required', 'string', 'max:255'],
            'job_description'  => ['required', 'string', 'max:10000'],
            'experience_level' => ['required', Rule::in(['junior', 'mid', 'senior'])],
            'interview_type'   => ['required', Rule::in(['technical', 'behavioral', 'mixed'])],
            'scheduled_at'     => ['nullable', 'date', 'after:now'],
            'alarm_message'    => ['nullable', 'string', 'max:500'],
        ];
    }
}

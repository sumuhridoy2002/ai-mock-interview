<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRecordingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Allow up to 500 MB — ensure PHP upload_max_filesize / post_max_size match
            'recording' => ['required', 'file', 'max:512000', 'mimes:webm,mp4,ogg'],
        ];
    }
}

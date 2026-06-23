<?php

namespace App\Services\Interview;

class TranscriptCleaner
{
    public function clean(?string $transcript): array
    {
        $text = trim($transcript ?? '');

        if ($text === '') {
            return ['text' => '', 'poor_quality' => false];
        }

        $hadGarbage = (bool) preg_match('/[^\x00-\x7F]{2,}/u', $text);
        $cleaned = preg_replace('/[^\x00-\x7F]{2,}/u', ' ', $text) ?? $text;
        $cleaned = preg_replace('/\s+/u', ' ', $cleaned) ?? $cleaned;
        $cleaned = trim($cleaned);

        return [
            'text' => $cleaned,
            'poor_quality' => $hadGarbage,
        ];
    }
}

<?php

namespace App\Services\Interview;

class PromptSanitizer
{
    private const MAX_LENGTH = 2000;

    private const INJECTION_PATTERNS = [
        '/ignore\s+(all\s+)?previous\s+instructions/i',
        '/you\s+are\s+now/i',
        '/system\s*:/i',
        '/<\/?system>/i',
        '/\[INST\]/i',
    ];

    public function sanitize(?string $text): string
    {
        if ($text === null || $text === '') {
            return '';
        }

        $text = strip_tags($text);
        $text = preg_replace(self::INJECTION_PATTERNS, '', $text) ?? $text;
        $text = trim(preg_replace('/\s+/', ' ', $text) ?? $text);

        return mb_substr($text, 0, self::MAX_LENGTH);
    }
}

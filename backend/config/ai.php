<?php

return [
    'service_url' => env('AI_SERVICE_URL', 'http://127.0.0.1:8001'),
    'service_secret' => env('AI_SERVICE_SECRET', ''),
    'timeout' => (int) env('AI_SERVICE_TIMEOUT', 60),
    'cv_timeout' => (int) env('AI_CV_TIMEOUT', 120),
    'report_timeout' => (int) env('AI_REPORT_TIMEOUT', 120),
    'transcribe_timeout' => (int) env('AI_TRANSCRIBE_TIMEOUT', 300),
    'eval_timeout' => (int) env('AI_EVAL_TIMEOUT', 120),
    'question_timeout' => (int) env('AI_QUESTION_TIMEOUT', 30),
    'cache_ttl' => (int) env('AI_CACHE_TTL', 86400),
];

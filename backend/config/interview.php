<?php

return [
    'max_questions' => (int) env('INTERVIEW_MAX_QUESTIONS', 10),
    'snapshot_interval_sec' => (int) env('SNAPSHOT_INTERVAL_SEC', 10),

    /*
    |--------------------------------------------------------------------------
    | Question Mastery Threshold
    |--------------------------------------------------------------------------
    | overall_score >= this value marks a question as "mastered" so it will
    | not be asked again in future interviews for the same user.
    */
    'mastery_threshold' => (int) env('INTERVIEW_MASTERY_THRESHOLD', 60),
];

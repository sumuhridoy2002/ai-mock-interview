<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Interview Report - {{ $interview->job_title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; }
        h1 { color: #4338ca; font-size: 22px; }
        h2 { color: #374151; font-size: 16px; margin-top: 24px; }
        .score { font-size: 36px; font-weight: bold; color: #059669; }
        .badge { display: inline-block; padding: 4px 12px; background: #eef2ff; border-radius: 4px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 4px; }
    </style>
</head>
<body>
    <h1>Mock Interview Report</h1>
    <p><strong>Candidate:</strong> {{ $interview->user->name }}</p>
    <p><strong>Role:</strong> {{ $interview->job_title }}</p>
    <p><strong>Level:</strong> {{ ucfirst($interview->experience_level) }}</p>
    <p><strong>Type:</strong> {{ ucfirst($interview->interview_type) }}</p>

    <h2>Overall Score</h2>
    <div class="score">{{ $report['overall_score'] ?? 0 }}/100</div>
    <p class="badge">Recommendation: {{ str_replace('_', ' ', ucfirst($report['hiring_recommendation'] ?? 'maybe')) }}</p>

    @if(!empty($report['category_scores']))
    <h2>Category Scores</h2>
    <ul>
        @foreach($report['category_scores'] as $category => $score)
            <li>{{ ucfirst(str_replace('_', ' ', $category)) }}: {{ $score }}/100</li>
        @endforeach
    </ul>
    @endif

    @if(!empty($report['strengths']))
    <h2>Strengths</h2>
    <ul>
        @foreach($report['strengths'] as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>
    @endif

    @if(!empty($report['weaknesses']))
    <h2>Weaknesses</h2>
    <ul>
        @foreach($report['weaknesses'] as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>
    @endif

    @if(!empty($report['improvement_areas']))
    <h2>Improvement Areas</h2>
    <ul>
        @foreach($report['improvement_areas'] as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>
    @endif

    @if(!empty($report['question_reviews']))
    <h2>Question-by-Question Review</h2>
    @foreach($report['question_reviews'] as $review)
        <h3>Question {{ $review['sequence'] ?? '' }} — {{ $review['score'] ?? 0 }}/100</h3>
        <p><strong>Q:</strong> {{ $review['question'] ?? '' }}</p>
        @if(!empty($review['your_answer']))
            <p><strong>Your answer:</strong> {{ $review['your_answer'] }}</p>
        @endif
        @if(!empty($review['strengths']))
            <p><strong>Strengths:</strong></p>
            <ul>
                @foreach($review['strengths'] as $item)
                    <li>{{ $item }}</li>
                @endforeach
            </ul>
        @endif
        @if(!empty($review['weaknesses']) || !empty($review['recommendations']))
            <p><strong>Improvements:</strong></p>
            <ul>
                @foreach(array_merge($review['weaknesses'] ?? [], $review['recommendations'] ?? []) as $item)
                    <li>{{ $item }}</li>
                @endforeach
            </ul>
        @endif
        @if(!empty($review['model_answer']) && !empty($review['needs_improvement']))
            <p><strong>Suggested strong answer:</strong> {{ $review['model_answer'] }}</p>
        @endif
        <br>
    @endforeach
    @endif
</body>
</html>

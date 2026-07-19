<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicShareLink;
use App\Models\Resume;
use App\Models\User;
use App\Services\UserPublicProfileService;
use App\Support\PlatformCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class PublicProfileController extends Controller
{
    public function __construct(
        private readonly UserPublicProfileService $profileService,
    ) {}

    public function leaderboard(Request $request): JsonResponse
    {
        $limit = min((int) $request->query('limit', 100), 100);

        $entries = Cache::remember(
            PlatformCache::leaderboardKey($limit),
            120,
            fn () => $this->profileService->buildLeaderboard($limit),
        );

        return response()
            ->json(['data' => $entries])
            ->withHeaders([
                'Cache-Control' => 'public, max-age=60, stale-while-revalidate=120',
            ]);
    }

    public function show(string $slug): JsonResponse
    {
        $user = User::query()
            ->where('public_slug', $slug)
            ->where('role', 'candidate')
            ->where('is_profile_public', true)
            ->first();

        if (! $user) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        return response()
            ->json(['profile' => $this->profileService->publicProfilePayload($user)])
            ->withHeaders([
                'Cache-Control' => 'public, max-age=60, stale-while-revalidate=120',
            ]);
    }

    public function share(string $token): JsonResponse
    {
        $link = PublicShareLink::where('token', $token)->first();

        if (! $link || ! $link->isActive()) {
            return response()->json(['message' => 'Share link is invalid or expired.'], 404);
        }

        $link->increment('view_count');
        $user = $link->user;

        $payload = [
            'label' => $link->label,
            'candidate' => [
                'name' => $user->name,
                'headline' => $user->public_headline,
            ],
            'includes_cv' => $link->includes_cv,
            'includes_reports' => $link->includes_reports,
            'includes_scores' => $link->includes_scores,
        ];

        if ($link->includes_scores) {
            $stats = $this->profileService->userStats($user);
            $payload['scores'] = [
                'average_score' => $stats['average_score'],
                'completed_count' => $stats['completed_count'],
            ];
            $payload['skills'] = $this->profileService->extractSkills($user);
        }

        if ($link->includes_reports) {
            $payload['interviews'] = $user->interviews()
                ->where('status', 'completed')
                ->with(['report:id,interview_id,overall_score,hiring_recommendation,strengths,weaknesses'])
                ->latest()
                ->get(['id', 'job_title', 'interview_type', 'created_at'])
                ->map(fn ($interview) => [
                    'id' => $interview->id,
                    'job_title' => $interview->job_title,
                    'interview_type' => $interview->interview_type,
                    'created_at' => $interview->created_at,
                    'overall_score' => $interview->report?->overall_score,
                    'hiring_recommendation' => $interview->report?->hiring_recommendation,
                    'strengths' => $interview->report?->strengths,
                    'weaknesses' => $interview->report?->weaknesses,
                ]);
        }

        if ($link->includes_cv) {
            $payload['resumes'] = $user->resumes()
                ->where('status', 'parsed')
                ->latest()
                ->get(['id', 'original_filename', 'mime_type', 'created_at']);
        }

        return response()->json(['share' => $payload, 'token' => $link->token]);
    }

    public function shareResumeFile(string $token, Resume $resume)
    {
        $link = PublicShareLink::where('token', $token)->first();

        if (! $link || ! $link->isActive() || ! $link->includes_cv) {
            abort(404);
        }

        if ($resume->user_id !== $link->user_id) {
            abort(404);
        }

        $path = $resume->storage_path;

        if (! $path || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        $mime = $resume->mime_type ?: Storage::disk('local')->mimeType($path) ?: 'application/octet-stream';

        return Storage::disk('local')->response(
            $path,
            $resume->original_filename,
            [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="'.addslashes($resume->original_filename).'"',
            ],
        );
    }
}

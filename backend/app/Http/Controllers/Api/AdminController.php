<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Interview;
use App\Models\PublicShareLink;
use App\Models\Resume;
use App\Models\User;
use App\Services\UserPublicProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function __construct(
        private readonly UserPublicProfileService $profileService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();

        $users = User::query()
            ->where('role', 'candidate')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->withCount('interviews')
            ->latest()
            ->paginate(20);

        $users->getCollection()->transform(function (User $user) {
            $stats = $this->profileService->userStats($user);

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'interview_count' => $stats['interview_count'],
                'completed_count' => $stats['completed_count'],
                'average_score' => $stats['average_score'],
                'is_profile_public' => $user->is_profile_public,
                'show_on_leaderboard' => $user->show_on_leaderboard,
                'public_slug' => $user->public_slug,
                'last_active_at' => $stats['last_active_at'],
                'created_at' => $user->created_at,
            ];
        });

        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $stats = $this->profileService->userStats($user);

        $interviews = $user->interviews()
            ->with(['report:id,interview_id,overall_score,hiring_recommendation,created_at'])
            ->latest()
            ->get(['id', 'job_title', 'status', 'interview_type', 'experience_level', 'created_at']);

        $resumes = $user->resumes()
            ->latest()
            ->get(['id', 'original_filename', 'status', 'parsed_profile', 'mime_type', 'created_at']);

        $shareLinks = $user->publicShareLinks()
            ->latest()
            ->get(['id', 'token', 'label', 'includes_cv', 'includes_reports', 'includes_scores', 'expires_at', 'revoked_at', 'view_count', 'created_at']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'public_slug' => $user->public_slug,
                'public_headline' => $user->public_headline,
                'is_profile_public' => $user->is_profile_public,
                'show_on_leaderboard' => $user->show_on_leaderboard,
                'created_at' => $user->created_at,
            ],
            'stats' => $stats,
            'skills' => $this->profileService->extractSkills($user),
            'interviews' => $interviews,
            'resumes' => $resumes,
            'share_links' => $shareLinks,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if ($user->isAdmin()) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $validated = $request->validate([
            'role' => ['sometimes', Rule::in(['admin', 'candidate'])],
            'public_slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:120',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('users', 'public_slug')->ignore($user->id),
            ],
            'public_headline' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_profile_public' => ['sometimes', 'boolean'],
            'show_on_leaderboard' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['role']) && $validated['role'] !== 'admin' && $user->isAdmin()) {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json(['message' => 'Cannot demote the last admin.'], 422);
            }
        }

        if (($validated['show_on_leaderboard'] ?? false) && ! ($validated['is_profile_public'] ?? $user->is_profile_public)) {
            return response()->json(['message' => 'Public profile must be enabled before joining the leaderboard.'], 422);
        }

        $user->update($validated);

        if ($user->is_profile_public && ! $user->public_slug) {
            $this->profileService->ensureSlug($user);
            $user->refresh();
        }

        if (! $user->is_profile_public) {
            $user->update(['show_on_leaderboard' => false]);
            $user->refresh();
        }

        return response()->json(['user' => $this->userPayload($user->fresh())]);
    }

    public function downloadReportPdf(User $user, Interview $interview)
    {
        if ($interview->user_id !== $user->id) {
            abort(404);
        }

        $report = $interview->report;

        if (! $report?->pdf_path || ! Storage::disk('local')->exists($report->pdf_path)) {
            abort(404);
        }

        return Storage::disk('local')->download($report->pdf_path, 'interview-report-'.$interview->id.'.pdf');
    }

    public function streamResumeFile(User $user, Resume $resume)
    {
        if ($resume->user_id !== $user->id) {
            abort(404);
        }

        $path = $resume->storage_path;

        if (! $path || ! Storage::disk('local')->exists($path)) {
            return response()->json(['message' => 'Resume file not found.'], 404);
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

    public function listShareLinks(User $user): JsonResponse
    {
        $links = $user->publicShareLinks()->latest()->get();

        return response()->json(['data' => $links]);
    }

    public function createShareLink(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:120'],
            'includes_cv' => ['sometimes', 'boolean'],
            'includes_reports' => ['sometimes', 'boolean'],
            'includes_scores' => ['sometimes', 'boolean'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);

        $link = $user->publicShareLinks()->create([
            'token' => Str::random(48),
            'label' => $validated['label'] ?? null,
            'includes_cv' => $validated['includes_cv'] ?? true,
            'includes_reports' => $validated['includes_reports'] ?? true,
            'includes_scores' => $validated['includes_scores'] ?? true,
            'expires_at' => $validated['expires_at'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['link' => $link], 201);
    }

    public function revokeShareLink(PublicShareLink $link): JsonResponse
    {
        $link->update(['revoked_at' => now()]);

        return response()->json(['message' => 'Share link revoked.', 'link' => $link->fresh()]);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        return $user->only(
            'id',
            'name',
            'email',
            'role',
            'public_slug',
            'is_profile_public',
            'show_on_leaderboard',
            'public_headline',
        );
    }
}

<?php

namespace Tests\Feature;

use App\Models\Interview;
use App\Models\InterviewReport;
use App\Models\PublicShareLink;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_leaderboard_excludes_non_opted_in_users(): void
    {
        $publicUser = User::factory()->create([
            'is_profile_public' => true,
            'show_on_leaderboard' => true,
            'public_slug' => 'public-candidate',
        ]);
        $this->createCompletedInterview($publicUser, 90);

        User::factory()->create([
            'is_profile_public' => false,
            'show_on_leaderboard' => false,
        ]);

        $response = $this->getJson('/api/v1/public/leaderboard');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('public-candidate', $response->json('data.0.slug'));
    }

    public function test_public_profile_requires_opt_in(): void
    {
        User::factory()->create([
            'public_slug' => 'hidden-user',
            'is_profile_public' => false,
        ]);

        $this->getJson('/api/v1/public/profiles/hidden-user')
            ->assertNotFound();
    }

    public function test_public_profile_returns_safe_fields_only(): void
    {
        User::factory()->create([
            'name' => 'Public Candidate',
            'email' => 'secret@example.com',
            'public_slug' => 'public-candidate',
            'is_profile_public' => true,
            'public_headline' => 'Backend developer',
        ]);

        $this->getJson('/api/v1/public/profiles/public-candidate')
            ->assertOk()
            ->assertJsonPath('profile.name', 'Public Candidate')
            ->assertJsonPath('profile.headline', 'Backend developer')
            ->assertJsonMissing(['email' => 'secret@example.com']);
    }

    public function test_share_link_respects_revocation(): void
    {
        $user = User::factory()->create();
        $link = PublicShareLink::create([
            'user_id' => $user->id,
            'token' => 'revoked-token',
            'includes_cv' => true,
            'includes_reports' => true,
            'includes_scores' => true,
            'revoked_at' => now(),
        ]);

        $this->getJson('/api/v1/public/share/'.$link->token)
            ->assertNotFound();
    }

    public function test_active_share_link_returns_dossier(): void
    {
        $user = User::factory()->create(['name' => 'Shared Candidate']);
        $link = PublicShareLink::create([
            'user_id' => $user->id,
            'token' => 'active-token',
            'includes_cv' => false,
            'includes_reports' => false,
            'includes_scores' => true,
        ]);

        $this->createCompletedInterview($user, 85);

        $this->getJson('/api/v1/public/share/'.$link->token)
            ->assertOk()
            ->assertJsonPath('share.candidate.name', 'Shared Candidate')
            ->assertJsonPath('share.scores.average_score', 85);
    }

    private function createCompletedInterview(User $user, int $score): Interview
    {
        $resume = Resume::create([
            'user_id' => $user->id,
            'original_filename' => 'cv.pdf',
            'storage_path' => 'resumes/test.pdf',
            'mime_type' => 'application/pdf',
            'file_hash' => uniqid('hash_', true),
            'status' => 'parsed',
        ]);

        $interview = Interview::create([
            'user_id' => $user->id,
            'resume_id' => $resume->id,
            'job_title' => 'Engineer',
            'job_description' => 'Build things',
            'experience_level' => 'mid',
            'interview_type' => 'technical',
            'status' => 'completed',
        ]);

        InterviewReport::create([
            'interview_id' => $interview->id,
            'overall_score' => $score,
            'category_scores' => [],
            'strengths' => [],
            'weaknesses' => [],
            'improvement_areas' => [],
            'hiring_recommendation' => 'yes',
            'report_json' => [],
        ]);

        return $interview;
    }
}

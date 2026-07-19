<?php

namespace Tests\Feature;

use App\Models\Interview;
use App\Models\InterviewReport;
use App\Models\PublicShareLink;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_always_creates_candidate_role(): void
    {
        $this->postJson('/api/v1/register', [
            'name' => 'New Candidate',
            'email' => 'candidate@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertCreated()
            ->assertJsonPath('user.role', 'candidate');

        $this->assertDatabaseHas('users', [
            'email' => 'candidate@example.com',
            'role' => 'candidate',
        ]);
    }

    public function test_candidate_cannot_access_admin_routes(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/admin/users')
            ->assertForbidden();
    }

    public function test_admin_can_list_users(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        User::factory()->count(2)->create();

        $this->getJson('/api/v1/admin/users')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_admin_can_view_other_users_interview_via_policy(): void
    {
        $admin = User::factory()->admin()->create();
        $candidate = User::factory()->create();
        $interview = $this->createInterviewFor($candidate);

        Sanctum::actingAs($admin);

        $this->assertTrue($admin->can('view', $interview));
    }

    public function test_candidate_cannot_view_other_users_interview(): void
    {
        $candidate = User::factory()->create();
        $other = User::factory()->create();
        $interview = $this->createInterviewFor($other);

        Sanctum::actingAs($candidate);

        $this->assertFalse($candidate->can('view', $interview));
    }

    public function test_admin_can_view_other_users_resume(): void
    {
        $admin = User::factory()->admin()->create();
        $candidate = User::factory()->create();
        $resume = $this->createResumeFor($candidate);

        Sanctum::actingAs($admin);

        $this->assertTrue($admin->can('view', $resume));
    }

    private function createResumeFor(User $user): Resume
    {
        return Resume::create([
            'user_id' => $user->id,
            'original_filename' => 'cv.pdf',
            'storage_path' => 'resumes/test.pdf',
            'mime_type' => 'application/pdf',
            'file_hash' => uniqid('hash_', true),
            'status' => 'parsed',
        ]);
    }

    private function createInterviewFor(User $user): Interview
    {
        $resume = $this->createResumeFor($user);

        return Interview::create([
            'user_id' => $user->id,
            'resume_id' => $resume->id,
            'job_title' => 'Software Engineer',
            'job_description' => 'Build APIs',
            'experience_level' => 'mid',
            'interview_type' => 'technical',
            'status' => 'completed',
        ]);
    }
}

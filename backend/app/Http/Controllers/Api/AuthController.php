<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Jobs\SendWelcomeEmailJob;
use App\Models\User;
use App\Services\UserPublicProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(
        private readonly UserPublicProfileService $profileService,
    ) {}

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'candidate',
        ]);

        SendWelcomeEmailJob::dispatch($user);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        /** @var User $user */
        $user = Auth::user();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function user(Request $request): JsonResponse|\Illuminate\Http\Response
    {
        /** @var User $user */
        $user = $request->user();
        $etag = '"'.md5((string) $user->updated_at).'"';

        if ($request->header('If-None-Match') === $etag) {
            return response()->noContent(304)->withHeaders([
                'ETag'          => $etag,
                'Cache-Control' => 'private, no-cache',
            ]);
        }

        return response()->json(['user' => $this->userPayload($user)])->withHeaders([
            'ETag'          => $etag,
            'Cache-Control' => 'private, no-cache',
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        if ($user->isAdmin()) {
            unset($validated['public_headline'], $validated['is_profile_public'], $validated['show_on_leaderboard']);
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

        return response()->json(['user' => $this->userPayload($user)]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! Hash::check($request->input('current_password'), $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => $request->input('password')]);

        return response()->json(['message' => 'Password updated successfully.']);
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

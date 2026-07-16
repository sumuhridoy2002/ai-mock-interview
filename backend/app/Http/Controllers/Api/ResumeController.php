<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreResumeRequest;
use App\Jobs\ParseResumeJob;
use App\Models\Resume;
use App\Services\Interview\ResumeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ResumeController extends Controller
{
    public function __construct(private readonly ResumeService $resumeService) {}

    public function index(Request $request): JsonResponse
    {
        $resumes = $request->user()
            ->resumes()
            ->latest()
            ->get(['id', 'original_filename', 'status', 'parsed_profile', 'mime_type', 'created_at']);

        return response()->json(['data' => $resumes]);
    }

    public function store(StoreResumeRequest $request): JsonResponse
    {
        $result = $this->resumeService->upload($request->user(), $request->file('file'));
        $resume = $result['resume'];

        return response()->json([
            'id' => $resume->id,
            'status' => $resume->status,
            'original_filename' => $resume->original_filename,
            'replaced' => $result['replaced'],
        ], $result['replaced'] ? 200 : 201);
    }

    public function show(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('view', $resume);

        return response()->json([
            'id' => $resume->id,
            'status' => $resume->status,
            'parsed_profile' => $resume->parsed_profile,
            'original_filename' => $resume->original_filename,
            'mime_type' => $resume->mime_type,
        ]);
    }

    public function streamFile(Request $request, Resume $resume): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $resume);

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

    public function reparse(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('update', $resume);

        $resume->update(['status' => 'processing']);
        ParseResumeJob::dispatchSync($resume->fresh());

        return response()->json([
            'id' => $resume->id,
            'status' => $resume->fresh()->status,
            'parsed_profile' => $resume->fresh()->parsed_profile,
        ]);
    }

    public function destroy(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('delete', $resume);

        $blockingIds = $this->resumeService->delete($resume);

        if ($blockingIds !== null) {
            return response()->json([
                'message' => 'This resume is linked to an interview that is not finished yet. Complete or cancel those interviews first.',
                'blocking_interview_ids' => $blockingIds,
            ], 422);
        }

        return response()->json(['message' => 'Resume deleted.']);
    }
}

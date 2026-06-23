<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreResumeRequest;
use App\Jobs\ParseResumeJob;
use App\Models\Resume;
use App\Services\Interview\ResumeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResumeController extends Controller
{
    public function __construct(private readonly ResumeService $resumeService) {}

    public function index(Request $request): JsonResponse
    {
        $resumes = $request->user()
            ->resumes()
            ->latest()
            ->get(['id', 'original_filename', 'status', 'parsed_profile', 'created_at']);

        return response()->json(['data' => $resumes]);
    }

    public function store(StoreResumeRequest $request): JsonResponse
    {
        $resume = $this->resumeService->upload($request->user(), $request->file('file'));

        return response()->json([
            'id' => $resume->id,
            'status' => $resume->status,
            'original_filename' => $resume->original_filename,
        ], 201);
    }

    public function show(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('view', $resume);

        return response()->json([
            'id' => $resume->id,
            'status' => $resume->status,
            'parsed_profile' => $resume->parsed_profile,
            'original_filename' => $resume->original_filename,
        ]);
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
}

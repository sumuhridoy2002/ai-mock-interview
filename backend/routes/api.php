<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InterviewController;
use App\Http\Controllers\Api\ResumeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Lightweight health/latency baseline — no auth, no DB
    Route::get('/ping', static fn () => response()->json([
        'ok'  => true,
        'env' => app()->environment(),
        'ts'  => now()->toISOString(),
    ]))->middleware('throttle:120,1');

    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);

        Route::get('/resumes', [ResumeController::class, 'index']);
        Route::post('/resumes', [ResumeController::class, 'store'])->middleware('throttle:60,1');
        Route::get('/resumes/{resume}', [ResumeController::class, 'show']);
        Route::post('/resumes/{resume}/reparse', [ResumeController::class, 'reparse']);

        Route::get('/interviews', [InterviewController::class, 'index']);
        Route::get('/interviews/scheduled', [InterviewController::class, 'scheduled']);
        Route::post('/interviews', [InterviewController::class, 'store']);
        Route::post('/interviews/{interview}/start', [InterviewController::class, 'start']);
        Route::patch('/interviews/{interview}/schedule', [InterviewController::class, 'updateSchedule']);
        Route::post('/interviews/{interview}/clear-schedule', [InterviewController::class, 'clearSchedule']);
        Route::post('/interviews/{interview}/trigger-alarm', [InterviewController::class, 'triggerAlarm']);
        Route::get('/interviews/{interview}/current-question', [InterviewController::class, 'currentQuestion']);
        Route::post('/interviews/{interview}/answers', [InterviewController::class, 'submitAnswer'])->middleware('throttle:30,1');
        Route::get('/interviews/{interview}/answers/{answerId}/score', [InterviewController::class, 'answerScore']);
        Route::post('/interviews/{interview}/complete', [InterviewController::class, 'complete']);
        Route::post('/interviews/{interview}/recording', [InterviewController::class, 'storeRecording'])->middleware('throttle:5,1');
        Route::get('/interviews/{interview}/recording', [InterviewController::class, 'streamRecording']);
        Route::post('/interviews/{interview}/answers/{answerId}/snapshots', [InterviewController::class, 'submitSnapshots'])->middleware('throttle:30,1');
        Route::get('/interviews/{interview}/answers/{answerId}/snapshots', [InterviewController::class, 'listSnapshots']);
        Route::get('/interviews/{interview}/answers/{answerId}/snapshots/{filename}', [InterviewController::class, 'streamSnapshot']);
        Route::get('/interviews/{interview}/report', [InterviewController::class, 'report']);
        Route::get('/interviews/{interview}/questions/{sequence}/explain', [InterviewController::class, 'explainQuestion']);
        Route::post('/interviews/{interview}/report/regenerate', [InterviewController::class, 'regenerateReport']);
        Route::get('/interviews/{interview}/report/pdf', [InterviewController::class, 'downloadPdf']);
    });
});
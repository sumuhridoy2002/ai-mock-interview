<?php

namespace App\Services\Interview;

use App\Jobs\ParseResumeJob;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ResumeService
{
    public function __construct(
        private readonly AiGatewayService $aiGateway,
    ) {}

    /**
     * @return array{resume: Resume, replaced: bool}
     */
    public function upload(User $user, UploadedFile $file): array
    {
        $hash = hash_file('sha256', $file->getRealPath());
        $filename = $file->getClientOriginalName();
        $path = $file->store('resumes/'.$user->id, 'local');

        $existing = Resume::query()
            ->where('user_id', $user->id)
            ->where('file_hash', $hash)
            ->first();

        if (! $existing) {
            $existing = Resume::query()
                ->where('user_id', $user->id)
                ->whereRaw('LOWER(original_filename) = ?', [strtolower($filename)])
                ->first();
        }

        if ($existing) {
            Storage::disk('local')->delete($existing->storage_path);

            $existing->update([
                'original_filename' => $filename,
                'storage_path' => $path,
                'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                'file_hash' => $hash,
                'parsed_profile' => null,
                'status' => 'pending',
            ]);

            ParseResumeJob::dispatch($existing);

            return ['resume' => $existing->fresh(), 'replaced' => true];
        }

        $resume = Resume::create([
            'user_id' => $user->id,
            'original_filename' => $filename,
            'storage_path' => $path,
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'file_hash' => $hash,
            'status' => 'pending',
        ]);

        ParseResumeJob::dispatch($resume);

        return ['resume' => $resume, 'replaced' => false];
    }

    /**
     * @return array<int>|null blocking interview IDs, or null on success
     */
    public function delete(Resume $resume): ?array
    {
        $blockingIds = $resume->interviews()
            ->whereIn('status', ['setup', 'active'])
            ->pluck('id')
            ->all();

        if ($blockingIds !== []) {
            return $blockingIds;
        }

        if ($resume->storage_path) {
            Storage::disk('local')->delete($resume->storage_path);
        }

        Cache::forget($this->cacheKey($resume));
        $resume->delete();

        return null;
    }

    public function getCachedProfile(Resume $resume): ?array
    {
        return Cache::get($this->cacheKey($resume));
    }

    public function cacheProfile(Resume $resume, array $profile): void
    {
        Cache::put($this->cacheKey($resume), $profile, config('ai.cache_ttl'));
    }

    public function extractText(Resume $resume): string
    {
        $fullPath = Storage::disk('local')->path($resume->storage_path);
        $extension = strtolower(pathinfo($resume->original_filename, PATHINFO_EXTENSION));

        if ($extension === 'pdf') {
            return $this->extractPdfText($fullPath);
        }

        if (in_array($extension, ['doc', 'docx'], true)) {
            return $this->extractDocxText($fullPath);
        }

        return file_get_contents($fullPath) ?: '';
    }

    private function extractPdfText(string $path): string
    {
        $text = shell_exec('pdftotext '.escapeshellarg($path).' - 2>NUL');

        if ($text) {
            return $text;
        }

        return file_get_contents($path) ?: '';
    }

    private function extractDocxText(string $path): string
    {
        $zip = new \ZipArchive;
        if ($zip->open($path) !== true) {
            return '';
        }

        $xml = $zip->getFromName('word/document.xml');
        $zip->close();

        if (! $xml) {
            return '';
        }

        $text = strip_tags(str_replace('<', ' <', $xml));

        return trim(preg_replace('/\s+/', ' ', $text) ?? '');
    }

    private function cacheKey(Resume $resume): string
    {
        return 'resume_profile:'.$resume->file_hash;
    }
}

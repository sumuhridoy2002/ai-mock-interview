<?php

namespace App\Services\Demo;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Generates portrait-like snapshot JPEGs and provides a shared sample interview video.
 */
class DemoMediaFactory
{
    private const FIXTURE_VIDEO = 'database/seeders/fixtures/sample-interview.mp4';

    public function ensureSampleVideo(): string
    {
        $absolute = base_path(self::FIXTURE_VIDEO);

        if (File::exists($absolute) && File::size($absolute) > 100_000) {
            return $absolute;
        }

        File::ensureDirectoryExists(dirname($absolute));

        if ($this->tryFfmpeg($absolute)) {
            return $absolute;
        }

        $this->writeMinimalMp4($absolute);

        return $absolute;
    }

    public function copyFullSessionVideo(int $interviewId): string
    {
        $source = $this->ensureSampleVideo();
        $dest = 'interviews/'.$interviewId.'/full/recording.mp4';

        Storage::disk('local')->put($dest, File::get($source));

        return $dest;
    }

    /**
     * @return list<string> Storage paths relative to local disk
     */
    public function generateAnswerSnapshots(int $interviewId, int $answerId, int $count, int $visualSeed): array
    {
        if (! extension_loaded('gd')) {
            throw new RuntimeException('PHP GD extension is required to generate demo snapshot images.');
        }

        $paths = [];
        $dir = 'interviews/'.$interviewId.'/snapshots/'.$answerId;

        for ($i = 0; $i < $count; $i++) {
            $filename = sprintf('snapshot_%03d.jpg', $i + 1);
            $relative = $dir.'/'.$filename;
            $binary = $this->renderPortraitJpeg(320, 240, $visualSeed + $i * 17);
            Storage::disk('local')->put($relative, $binary);
            $paths[] = $relative;
        }

        return $paths;
    }

    /**
     * @return array<string, mixed>
     */
    public function snapshotBehaviorPayload(int $snapshotCount, int $confidence, int $nervousness): array
    {
        $emotions = ['neutral' => 0.45, 'happy' => 0.25, 'surprised' => 0.15];
        if ($nervousness > 50) {
            $emotions = ['neutral' => 0.35, 'fearful' => 0.2, 'sad' => 0.1, 'happy' => 0.15];
        }

        $frameScores = [];
        for ($i = 0; $i < $snapshotCount; $i++) {
            $frameScores[] = [
                'face_detected' => true,
                'confidence' => max(40, min(95, $confidence + random_int(-8, 8))),
                'nervousness' => max(5, min(80, $nervousness + random_int(-8, 8))),
                'dominant_emotion' => array_key_first($emotions),
                'eye_contact' => round(0.55 + ($confidence / 200), 2),
            ];
        }

        return [
            'confidence' => $confidence,
            'nervousness' => $nervousness,
            'eye_contact_ratio' => round(0.55 + ($confidence / 250), 3),
            'head_stability' => round(0.65 + ($confidence / 400), 3),
            'blink_rate' => (float) random_int(12, 20),
            'emotion_distribution' => $emotions,
            'coaching_narrative' => $confidence >= 70
                ? 'Demo data: steady eye contact and calm delivery. Keep using concrete examples.'
                : 'Demo data: moderate nervousness detected. Slow down and structure answers with STAR.',
            'frames_analyzed' => $snapshotCount,
            'snapshots_count' => $snapshotCount,
            'frame_scores' => $frameScores,
        ];
    }

    private function tryFfmpeg(string $absolute): bool
    {
        $ffmpeg = $this->resolveFfmpeg();
        if ($ffmpeg === null) {
            return false;
        }

        $cmd = sprintf(
            '%s -y -f lavfi -i color=c=0x1e1b4b:s=640x480:d=10 -f lavfi -i sine=frequency=220:duration=10 -c:v libx264 -tune stillimage -pix_fmt yuv420p -c:a aac -shortest %s 2>NUL',
            escapeshellarg($ffmpeg),
            escapeshellarg($absolute),
        );

        @exec($cmd, $output, $code);

        return $code === 0 && File::exists($absolute) && File::size($absolute) > 1000;
    }

    private function resolveFfmpeg(): ?string
    {
        foreach (['ffmpeg', 'C:\\laragon\\bin\\ffmpeg\\ffmpeg.exe'] as $candidate) {
            @exec(escapeshellarg($candidate).' -version 2>NUL', $out, $code);
            if ($code === 0) {
                return $candidate;
            }
        }

        return null;
    }

    private function writeMinimalMp4(string $absolute): void
    {
        // Minimal valid MP4 (ftyp + mdat) — short black clip placeholder when ffmpeg is unavailable.
        $hex = '00000018667479706D703432000000006D70343269736F6D0000028D6D646174'
            .str_repeat('00', 512);
        File::put($absolute, hex2bin($hex) ?: '');
    }

    private function renderPortraitJpeg(int $width, int $height, int $seed): string
    {
        $img = imagecreatetruecolor($width, $height);
        if ($img === false) {
            throw new RuntimeException('Could not create GD image.');
        }

        $rng = abs($seed) % 360;
        $bg = imagecolorallocate($img, 30 + ($rng % 40), 40 + ($rng % 30), 80 + ($rng % 50));
        imagefilledrectangle($img, 0, 0, $width, $height, $bg);

        $skin = imagecolorallocate($img, 210 - ($rng % 35), 170 - ($rng % 25), 140 - ($rng % 20));
        $hair = imagecolorallocate($img, 40 + ($rng % 30), 30 + ($rng % 20), 20 + ($rng % 15));
        $shirt = imagecolorallocate($img, 60 + ($rng % 50), 80 + ($rng % 60), 120 + ($rng % 40));

        $cx = (int) ($width / 2);
        $cy = (int) ($height * 0.42);
        imagefilledellipse($img, $cx, $cy, (int) ($width * 0.42), (int) ($height * 0.48), $skin);
        imagefilledellipse($img, $cx, $cy - (int) ($height * 0.12), (int) ($width * 0.44), (int) ($height * 0.28), $hair);
        imagefilledrectangle($img, (int) ($width * 0.2), (int) ($height * 0.62), (int) ($width * 0.8), $height, $shirt);

        $eye = imagecolorallocate($img, 35, 35, 45);
        imagefilledellipse($img, $cx - 28, $cy - 5, 14, 10, $eye);
        imagefilledellipse($img, $cx + 28, $cy - 5, 14, 10, $eye);

        $label = imagecolorallocate($img, 255, 255, 255);
        imagestring($img, 2, 8, $height - 16, 'Demo snapshot', $label);

        ob_start();
        imagejpeg($img, null, 82);
        imagedestroy($img);
        $binary = ob_get_clean();

        if ($binary === false || $binary === '') {
            throw new RuntimeException('Failed to encode demo snapshot JPEG.');
        }

        return $binary;
    }
}

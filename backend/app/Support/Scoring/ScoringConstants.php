<?php

namespace App\Support\Scoring;

class ScoringConstants
{
    private static ?array $data = null;

    public static function all(): array
    {
        if (self::$data === null) {
            $path = dirname(base_path()).'/shared/scoring/constants.json';
            $json = file_get_contents($path);
            self::$data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        }

        return self::$data;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $parts = explode('.', $key);
        $value = self::all();

        foreach ($parts as $part) {
            if (! is_array($value) || ! array_key_exists($part, $value)) {
                return $default;
            }
            $value = $value[$part];
        }

        return $value;
    }

    public static function threshold(string $key): int
    {
        return (int) self::get("thresholds.{$key}");
    }

    public static function hiringThreshold(string $tier): int
    {
        return (int) self::get("thresholds.hiring.{$tier}");
    }
}

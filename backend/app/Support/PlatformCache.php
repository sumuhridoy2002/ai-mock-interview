<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class PlatformCache
{
    public static function userStatsKey(int $userId): string
    {
        return "platform.user.stats.{$userId}";
    }

    public static function publicProfileKey(string $slug): string
    {
        return "platform.public.profile.{$slug}";
    }

    public static function leaderboardKey(int $limit): string
    {
        return "platform.public.leaderboard.{$limit}";
    }

    public const ADMIN_STATS = 'platform.admin.stats';

    public static function forgetUser(int $userId, ?string $slug = null): void
    {
        Cache::forget(self::userStatsKey($userId));

        if ($slug) {
            Cache::forget(self::publicProfileKey($slug));
        }

        self::forgetLeaderboard();
        Cache::forget(self::ADMIN_STATS);
    }

    public static function forgetLeaderboard(): void
    {
        for ($limit = 10; $limit <= 100; $limit += 10) {
            Cache::forget(self::leaderboardKey($limit));
        }
        Cache::forget(self::leaderboardKey(100));
    }

    public static function forgetAdminStats(): void
    {
        Cache::forget(self::ADMIN_STATS);
    }
}

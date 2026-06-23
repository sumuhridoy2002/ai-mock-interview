<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Broadcast::channel('interview.{sessionUuid}', function ($user, string $sessionUuid) {
    return $user->interviews()
        ->whereHas('session', fn ($q) => $q->where('session_uuid', $sessionUuid))
        ->exists();
});

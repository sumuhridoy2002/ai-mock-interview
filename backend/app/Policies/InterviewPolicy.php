<?php

namespace App\Policies;

use App\Models\Interview;
use App\Models\User;

class InterviewPolicy
{
    public function view(User $user, Interview $interview): bool
    {
        return $user->isAdmin() || $interview->user_id === $user->id;
    }

    public function update(User $user, Interview $interview): bool
    {
        return $interview->user_id === $user->id;
    }

    public function delete(User $user, Interview $interview): bool
    {
        return $interview->user_id === $user->id;
    }
}

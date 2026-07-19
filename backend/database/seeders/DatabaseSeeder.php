<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    private const DUMMY_USER_COUNT = 500;

    public function run(): void
    {
        $this->seedAdminUser();
        $this->seedDummyCandidates();
    }

    private function seedAdminUser(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@mockinterview.pro');
        $password = env('ADMIN_PASSWORD', 'password');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => env('ADMIN_NAME', 'Platform Admin'),
                'password' => Hash::make($password),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );
    }

    private function seedDummyCandidates(): void
    {
        $password = Hash::make(env('DUMMY_USER_PASSWORD', 'password'));
        $now = now();
        $rows = [];

        for ($i = 1; $i <= self::DUMMY_USER_COUNT; $i++) {
            $number = str_pad((string) $i, 3, '0', STR_PAD_LEFT);

            $rows[] = [
                'name' => "Test Candidate {$number}",
                'email' => "candidate{$number}@mockinterview.test",
                'password' => $password,
                'role' => 'candidate',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            User::upsert(
                $chunk,
                ['email'],
                ['name', 'password', 'role', 'email_verified_at', 'updated_at'],
            );
        }

        $this->command?->info(sprintf(
            'Seeded %d dummy candidates (candidate001@mockinterview.test … candidate500@mockinterview.test, password: %s).',
            self::DUMMY_USER_COUNT,
            env('DUMMY_USER_PASSWORD', 'password'),
        ));
    }
}

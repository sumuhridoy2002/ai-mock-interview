<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$interview = App\Models\Interview::find(3);
$session   = $interview->session;

$pending = $interview->questions()->whereDoesntHave('answer')->count();
$total   = $interview->questions()->count();

echo "Status: {$interview->status}\n";
echo "Session UUID: {$session->session_uuid}\n";
echo "Total questions: {$total}\n";
echo "Pending (unanswered) questions: {$pending}\n";

if ($pending === 0) {
    echo "No pending question — dispatching GenerateQuestionJob...\n";
    App\Jobs\GenerateQuestionJob::dispatch($interview, $session);
    echo "Job dispatched to queue.\n";
} else {
    echo "A pending question already exists — no dispatch needed.\n";
}

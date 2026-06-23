<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Interview reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
    <h1 style="color: #d97706;">Interview in 10 minutes</h1>
    <p>Your mock interview for <strong>{{ $jobTitle }}</strong> is scheduled for:</p>
    <p style="font-size: 18px; font-weight: bold;">{{ $scheduledAt }}</p>
    @if($message)
        <p style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px;">{{ $message }}</p>
    @endif
    <p>Open the app before the scheduled time so your browser alarm can fire at the exact moment.</p>
    <p>
        <a href="{{ $dashboardUrl }}" style="display: inline-block; background: #d97706; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; margin-right: 8px;">
            Open Dashboard
        </a>
    </p>
    <p style="font-size: 12px; color: #64748b; margin-top: 32px;">This is a one-time reminder sent 10 minutes before your interview.</p>
</body>
</html>

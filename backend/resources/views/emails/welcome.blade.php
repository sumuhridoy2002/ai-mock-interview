<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
    <h1 style="color: #4f46e5;">Welcome to {{ config('app.name') }}</h1>
    <p>Hi {{ $userName }},</p>
    <p>Your account is ready. Here is how to get started:</p>
    <ol>
        <li><a href="{{ $resumeUrl }}">Upload your CV</a> (PDF or DOCX)</li>
        <li><a href="{{ $setupUrl }}">Set up a mock interview</a> with job title and description</li>
        <li>Start now or schedule for later — we will remind you by email and in the browser</li>
    </ol>
    <p>
        <a href="{{ $dashboardUrl }}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none;">
            Go to Dashboard
        </a>
    </p>
    <p style="font-size: 12px; color: #64748b; margin-top: 32px;">Good luck with your practice interviews!</p>
</body>
</html>

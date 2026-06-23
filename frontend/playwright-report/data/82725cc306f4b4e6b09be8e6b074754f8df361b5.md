# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-journey.spec.ts >> Full user journey — register, interviews, alarm, logout >> register → login → resume → instant + scheduled interviews → alarm → logout
- Location: e2e\full-journey.spec.ts:86:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\hp\AppData\Local\ms-playwright\chromium-1228\chrome-win64\chrome.exe
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```
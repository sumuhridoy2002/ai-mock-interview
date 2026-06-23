import { test, expect, type Page } from "@playwright/test";
import path from "path";

const API_URL = process.env.PLAYWRIGHT_API_URL || "http://localhost:8000/api/v1";
const RESUME_FIXTURE = path.join(__dirname, "fixtures", "sample-resume.pdf");

const unique = Date.now();
const user = {
  name: "Journey Tester",
  email: `journey.${unique}@mockinterview.test`,
  password: "Password123!",
};

const JOB_INSTANT = {
  title: "Junior Office Assistant",
  description:
    "Front desk support, scheduling, Excel reports, customer communication, and document management.",
};

const JOB_SCHEDULED = {
  title: "Scheduled Desk Executive",
  description:
    "Calendar management, meeting coordination, PowerPoint decks, and professional email writing.",
};

/** datetime-local value at least 2 minutes in the future */
function scheduleInMinutes(minutes: number): string {
  const d = new Date(Date.now() + minutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

async function waitForResumeParsed(page: Page, timeoutMs = 180_000) {
  const token = await page.evaluate(() => localStorage.getItem("auth_token"));
  if (!token) throw new Error("No auth token");

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await page.request.get(`${API_URL}/resumes`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (res.ok()) {
      const body = await res.json();
      const rows = body.data as { status: string }[];
      if (rows?.some((r) => r.status === "parsed")) return;
    }
    await page.waitForTimeout(3000);
  }
  throw new Error("Resume was not parsed in time (is queue worker + AI service running?)");
}

async function completeLiveInterview(page: Page) {
  await expect(page.getByRole("button", { name: "Enable Camera & Mic" })).toBeVisible({
    timeout: 90_000,
  });
  await page.getByRole("button", { name: "Enable Camera & Mic" }).click();

  await expect(page.getByRole("button", { name: "End Interview" })).toBeVisible({
    timeout: 120_000,
  });

  // Short optional answer if Record is available
  const recordBtn = page.getByRole("button", { name: "Record Answer" });
  if (await recordBtn.isEnabled().catch(() => false)) {
    await recordBtn.click();
    await page.waitForTimeout(2500);
    const stopBtn = page.getByRole("button", { name: "Stop & Submit" });
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
      await page.waitForTimeout(5000);
    }
  }

  await page.getByRole("button", { name: "End Interview" }).click();
  await expect(page).toHaveURL(/\/interview\/result\/\d+/, { timeout: 180_000 });
}

test.describe.configure({ mode: "serial" });

test.describe("Full user journey — register, interviews, alarm, logout", () => {
  test.setTimeout(600_000);

  test("register → login → resume → instant + scheduled interviews → alarm → logout", async ({
    page,
  }) => {
    // ── Register ──────────────────────────────────────────────────────────────
    await page.goto("/register");
    await page.locator("form input").nth(0).fill(user.name);
    await page.locator('input[type="email"]').fill(user.email);
    const pw = page.locator('input[type="password"]');
    await pw.nth(0).fill(user.password);
    await pw.nth(1).fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

    // ── Logout ────────────────────────────────────────────────────────────────
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    // ── Login ─────────────────────────────────────────────────────────────────
    await page.locator('form input[type="email"]').fill(user.email);
    await page.locator('form input[type="password"]').fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

    // ── Upload resume ─────────────────────────────────────────────────────────
    await page.goto("/resume/upload");
    await page.locator('input[type="file"]').setInputFiles(RESUME_FIXTURE);
    await waitForResumeParsed(page);
    await page.reload();
    await expect(page.getByText("sample-resume.pdf")).toBeVisible();

    // ── Interview 1: start now (instant) ────────────────────────────────────
    await page.goto("/interview/setup");
    await page.getByPlaceholder("Senior Laravel Developer").fill(JOB_INSTANT.title);
    await page.getByPlaceholder("Paste the job description...").fill(JOB_INSTANT.description);
    await page.getByRole("button", { name: "Start Now" }).click();
    await page.getByRole("button", { name: "Start Interview" }).click();
    await expect(page).toHaveURL(/\/interview\/live\//, { timeout: 30_000 });
    await completeLiveInterview(page);

    // ── Interview 2: schedule ~2 minutes ahead ────────────────────────────────
    await page.goto("/interview/setup");
    await page.getByPlaceholder("Senior Laravel Developer").fill(JOB_SCHEDULED.title);
    await page.getByPlaceholder("Paste the job description...").fill(JOB_SCHEDULED.description);
    await page.getByRole("button", { name: "Schedule for Later" }).click();

    const scheduledAt = scheduleInMinutes(2);
    await page.locator('input[type="datetime-local"]').fill(scheduledAt);
    await page.getByRole("button", { name: "Schedule Interview" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByText(JOB_SCHEDULED.title)).toBeVisible({ timeout: 15_000 });

    // ── Wait for alarm, then start from banner ────────────────────────────────
    const startFromAlarm = page.getByRole("button", { name: "Start Interview Now" });
    await expect(startFromAlarm).toBeVisible({ timeout: 180_000 });
    await startFromAlarm.click();
    await expect(page).toHaveURL(/\/interview\/live\//, { timeout: 30_000 });
    await completeLiveInterview(page);

    // ── Logout ────────────────────────────────────────────────────────────────
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(page.locator('form input[type="email"]')).toBeVisible();
  });
});

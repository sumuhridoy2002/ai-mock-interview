import { test, expect, type APIRequestContext } from "@playwright/test";

const unique = Date.now();
const testUser = {
  name: "E2E Tester",
  email: `e2e.${unique}@mockinterview.test`,
  password: "Password123!",
};

const API_URL = process.env.PLAYWRIGHT_API_URL || "http://localhost:8000/api/v1";

async function registerUser(request: APIRequestContext) {
  const response = await request.post(`${API_URL}/register`, {
    data: {
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      password_confirmation: testUser.password,
    },
  });
  expect(response.ok(), `Register failed: ${await response.text()}`).toBeTruthy();
  const body = await response.json();
  return body.token as string;
}

async function seedAuth(page: import("@playwright/test").Page, token: string) {
  await page.goto("/login");
  await page.evaluate((t) => localStorage.setItem("auth_token", t), token);
}

test.describe.configure({ mode: "serial" });

test.describe("Mock Interview Pro — smoke automation", () => {
  let token = "";

  test.beforeAll(async ({ request }) => {
    token = await registerUser(request);
  });

  test.beforeEach(async ({ page }) => {
    await seedAuth(page, token);
  });

  test("register page UI and dashboard after auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Track your interview progress")).toBeVisible();
  });

  test("interview setup form and schedule mode", async ({ page }) => {
    await page.goto("/interview/setup");
    await expect(page.getByRole("heading", { name: "Interview Setup" })).toBeVisible();

    await page.getByPlaceholder("Senior Laravel Developer").fill("Intern Desk Executive");
    await page.getByPlaceholder("Paste the job description...").fill(
      "Office administration, Excel, PowerPoint, scheduling, and front-desk support."
    );

    await page.getByRole("button", { name: "Schedule for Later" }).click();
    await expect(page.getByText("Date & Time")).toBeVisible();
    await expect(page.getByText("Alarm Message")).toBeVisible();

    await page.getByRole("button", { name: "Start Now" }).click();
    await expect(page.getByRole("button", { name: "Start Interview" })).toBeVisible();
  });

  test("resume upload page loads", async ({ page }) => {
    await page.goto("/resume/upload");
    await expect(page.getByRole("heading", { name: "Upload Resume" })).toBeVisible();
    await expect(page.getByText("PDF or DOCX")).toBeVisible();
  });

  test("system status footer is visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTitle("System Performance Score — open monitor")).toBeVisible({ timeout: 20000 });
  });

  test("system monitor shows performance score and comparison table", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTitle("System Performance Score — open monitor").click();
    await expect(page.getByText("System Performance Score", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Compare" }).click();
    await expect(page.getByText("CV-based personalized questions")).toBeVisible();
    await expect(page.getByText("Pramp")).toBeVisible();
  });

  test("login page works for created user", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await page.locator('form input[type="email"]').fill(testUser.email);
    await page.locator('form input[type="password"]').fill(testUser.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});

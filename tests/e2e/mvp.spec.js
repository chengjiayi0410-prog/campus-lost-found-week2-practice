import { expect, test } from "@playwright/test";

const backendApiUrl = "http://127.0.0.1:3100/api";

async function login(page, username, password) {
  await page.goto("/login");
  await page.getByLabel("用户名").fill(username);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("login persists after a page reload", async ({ page }) => {
  await login(page, "student1", "TestPass123!");

  await expect(page.getByText("测试同学", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "管理" })).toHaveCount(0);

  await page.reload();

  await expect(page.getByText("测试同学", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "退出" })).toBeVisible();
});

test("publishes a post and shows its detail", async ({ page }) => {
  const title = `E2E 发布测试 ${Date.now()}`;

  await login(page, "student1", "TestPass123!");
  await page.getByRole("link", { name: "发布", exact: true }).click();

  await page.getByLabel("信息类型").selectOption("found");
  await page.getByLabel("物品分类").selectOption("electronics");
  await page.getByLabel("物品名称").fill(title);
  await page.getByLabel("详细描述").fill("Playwright 创建的真实发布测试。");
  await page.getByLabel("丢失或拾取地点").fill("自动化测试楼 101");

  await page.getByRole("button", { name: "发布信息" }).click();

  await expect(page).toHaveURL(/\/items\/\d+$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("测试同学", { exact: true })).toBeVisible();

  await page.goto("/");
  await page.getByLabel("搜索物品").fill(title);
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});

test("lets an admin delete a post", async ({ page, request }) => {
  const title = `E2E 删除测试 ${Date.now()}`;

  await login(page, "student1", "TestPass123!");

  const token = await page.evaluate(() =>
    localStorage.getItem("campus_lost_found_token")
  );
  const created = await request.post(`${backendApiUrl}/posts`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: {
      type: "lost",
      category: "other",
      title,
      description: "用于验证管理员 E2E 删除。",
      location: "自动化测试楼"
    }
  });

  expect(created.status()).toBe(201);

  await page.getByRole("button", { name: "退出" }).click();
  await login(page, "admin", "AdminPass123!");
  await page.getByRole("link", { name: "管理", exact: true }).click();

  const row = page.locator(".admin-row").filter({
    hasText: title
  });

  await expect(row).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "删除" }).click();

  await expect(row).toHaveCount(0);

  await page.goto("/");
  await page.getByLabel("搜索物品").fill(title);
  await expect(page.getByText("没有匹配的信息")).toBeVisible();
});

import { test, expect } from "@playwright/test"

test("has title", async ({ page }) => {
  await page.goto("/")

  // Expect a title "to contain" a substring.
  // Using a generic check for now since we don't know the exact title,
  // but it should at least load and have a title.
  await expect(page).not.toHaveTitle("")
})

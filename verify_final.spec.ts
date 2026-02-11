import { test, expect } from '@playwright/test';

test('Verify localized portals and Price Scout', async ({ page }) => {
  // Wait for server to be ready on 5174
  await page.goto('http://localhost:5174/my/login');
  await page.waitForSelector('h2');
  await page.screenshot({ path: 'verification/login_my.png' });

  // Login to Seller Portal (PIN 0909)
  await page.fill('input[type="text"]', '0909');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/my');
  await page.screenshot({ path: 'verification/dashboard_my.png' });

  // Go to Price Scout (Laptops)
  await page.goto('http://localhost:5174/my/laptops');
  await page.waitForSelector('h2');
  await page.screenshot({ path: 'verification/price_scout_init.png' });

  // Search for a laptop
  await page.fill('#ps-brand', 'Apple');
  await page.fill('#ps-model', 'MacBook Pro 14 M3');
  await page.click('button:has-text("Find Prices"), button:has-text("Найти цены")');

  // Wait for results
  await page.waitForSelector('h3:has-text("Price analysis"), h3:has-text("Анализ цен")', { timeout: 10000 });
  await page.screenshot({ path: 'verification/price_scout_results.png', fullPage: true });
});

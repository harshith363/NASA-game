import { expect, test, type Page } from '@playwright/test';

async function activate(page: Page, name: string | RegExp, role: 'button' | 'link' = 'button') {
  for (let step = 0; step < 100; step++) {
    const target = page.getByRole(role, { name, exact: typeof name === 'string' });
    if (await target.evaluateAll(elements => elements.some(element => element === document.activeElement))) {
      await page.keyboard.press('Enter');
      return;
    }
    await page.keyboard.press('Tab');
  }
  throw new Error(`Keyboard could not reach ${name}`);
}

async function continueLines(page: Page, count: number, next: string) {
  for (let index = 0; index < count - 1; index++) await activate(page, 'Continue');
  await activate(page, next);
}

test('completes the full story using only keyboard, resumes after reload, and restores both artifacts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().includes('/assets/') && response.status() >= 400) errors.push(response.url());
  });
  await page.goto('/');
  await activate(page, 'Begin Journey');
  await expect(page.getByRole('heading', { name: 'An unfinished story' })).toBeVisible();
  await activate(page, 'Continue');
  await page.reload();
  await expect(page.getByText('First, weeks of travel.', { exact: false })).toBeVisible();
  await continueLines(page, 12, 'Respond');
  await activate(page, 'Show me why it mattered.');
  await expect(page.getByText('That is exactly the question.')).toBeVisible();
  await activate(page, 'Begin lunar flyby');
  await continueLines(page, 6, 'Inspect the landing site');
  await activate(page, 'Ascent stage');
  await expect(page.getByRole('status')).toContainText('platform');
  await activate(page, 'Descent stage');
  await activate(page, 'Inspect upper stage');
  await activate(page, 'Inspect lower stage');
  await activate(page, 'Continue to the explanation question');
  await activate(page, 'It was the landing platform; the ascent stage lifted off.');
  await activate(page, 'Restore the record');
  await expect(page.getByText('Restored', { exact: true })).toBeVisible();
  await continueLines(page, 3, 'Continue to Mars');
  await continueLines(page, 7, 'Investigate Opportunity');
  await activate(page, 'Select Eagle Crater'); await activate(page, /^Slot 1/);
  await activate(page, 'Select Clues in the rocks'); await activate(page, /^Slot 2/);
  await activate(page, 'Select The final traverse'); await activate(page, /^Slot 3/);
  await activate(page, 'Check the trail');
  await activate(page, 'Living animals on Mars');
  await expect(page.getByRole('status')).toContainText('ancient environments');
  await activate(page, 'Past water-related conditions on Mars');
  await activate(page, 'Restore the record');
  await continueLines(page, 4, 'Open final mission record');
  await continueLines(page, 10, 'Choose the museum caption');
  await expect(page.getByRole('list', { name: 'Opportunity mission timeline' })).toContainText('Jun 10, 2018');
  await activate(page, 'Opportunity revealed evidence of Mars’s watery past and explored for nearly 15 years.');
  await activate(page, 'Restore the record');
  await continueLines(page, 3, 'Finish the Archive');
  await continueLines(page, 6, 'Respond');
  await activate(page, 'The people who kept asking questions.');
  await activate(page, 'Complete journey');
  await expect(page.getByRole('heading', { name: /Some missions end/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /Some missions end/ })).toBeVisible();
  await activate(page, 'Explore the Archive', 'link');
  await expect(page.getByText('Restored', { exact: true })).toBeVisible();
  await activate(page, 'Mars');
  await expect(page.getByText('Restored', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe('390px touch viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  test('opens archive independently, taps a replay puzzle, and keeps motion and overflow under control', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-hero img')).toBeVisible();
    await expect.poll(() => page.locator('.home-hero img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    expect(await page.locator('.home-hero img').evaluate(image => getComputedStyle(image).animationDuration)).toBe('1e-06s');
    await page.getByRole('link', { name: 'Explore Archive', exact: true }).tap();
    await page.getByRole('button', { name: 'Mars', exact: true }).tap();
    await expect(page.getByRole('heading', { name: /Mars Exploration Rover Opportunity/ })).toBeVisible();
    await expect(page.getByText('Restored', { exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: 'Open full record' }).tap();
    await page.getByRole('link', { name: 'Replay puzzle' }).tap();
    await page.getByRole('button', { name: 'Select Eagle Crater' }).tap();
    await page.getByRole('button', { name: /^Slot 1/ }).tap();
    await expect(page.getByRole('button', { name: /Slot 1: Arrival, Eagle Crater/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.getByRole('button', { name: 'Open settings' }).tap();
    await page.getByRole('checkbox', { name: 'Reduce motion' }).tap();
    await page.reload();
    await page.getByRole('button', { name: 'Open settings' }).tap();
    await expect(page.getByRole('checkbox', { name: 'Reduce motion' })).toBeChecked();
  });
});

test('recovers an unsupported save with a reset confirmation', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('echoes:legacy-archive:v1', '{"schemaVersion":90}'));
  await page.goto('/story');
  await expect(page.getByRole('alert')).toContainText('could not be read');
  await page.getByRole('button', { name: 'Reset saved mission' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Begin Journey' }).click();
  await expect(page.getByRole('heading', { name: 'An unfinished story' })).toBeVisible();
});

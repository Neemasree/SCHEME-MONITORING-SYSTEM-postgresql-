import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

const baseUrl = (process.env.CIVICTRACK_BASE_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '');
const email = `civictrack.e2e.${randomUUID()}@example.test`;
const password = 'E2eStrongPass123';
const browser = await chromium.launch({ headless: true });
const pageErrors = [];

try {
    const page = await browser.newPage();
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Full Name').fill('CivicTrack E2E Beneficiary');
    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL((url) => url.pathname === '/login');

    await page.getByRole('button', { name: /Beneficiary/ }).click();
    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Authenticate User' }).click();
    await page.waitForURL((url) => url.pathname === '/beneficiary/applications');

    await page.getByRole('heading', { name: 'My Scheme Applications' }).waitFor({
        state: 'visible',
    });
    const schemeSelect = page.getByLabel('Active scheme');
    await schemeSelect.waitFor({ state: 'visible' });
    await schemeSelect.selectOption('1');
    await page.getByRole('button', { name: 'Submit application' }).click();

    await page.getByRole('status').filter({
        hasText: 'Application submitted.',
    }).waitFor({ state: 'visible' });

    const submittedApplication = page.locator('article')
        .filter({ hasText: 'Farmer Subsidy Scheme' })
        .first();
    await submittedApplication.waitFor({ state: 'visible' });
    await submittedApplication.getByText('Pending Field Officer', { exact: true }).waitFor({
        state: 'visible',
    });

    assert.deepEqual(pageErrors, [], 'The browser journey should not produce uncaught page errors');
    console.log('PASS: beneficiary registered, signed in, loaded an active scheme, submitted an application, and saw it in refreshed application history.');
} finally {
    await browser.close();
}

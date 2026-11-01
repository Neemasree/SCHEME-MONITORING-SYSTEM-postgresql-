import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

const baseUrl = (process.env.CIVICTRACK_BASE_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '');
const email = `civictrack.e2e.${randomUUID()}@example.test`;
const password = 'E2eStrongPass123';
const browser = await chromium.launch({ headless: true });
const pageErrors = [];

const loginAs = async (roleLabel, accountEmail, accountPassword, expectedPath) => {
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL((url) => url.pathname === '/login');
    await page.getByRole('button', { name: new RegExp(roleLabel) }).click();
    await page.getByLabel('Email Address').fill(accountEmail);
    await page.getByLabel('Password').fill(accountPassword);
    await page.getByRole('button', { name: 'Authenticate User' }).click();
    await page.waitForURL((url) => url.pathname === expectedPath);
};

const reviewApplication = async ({
    roleLabel,
    accountEmail,
    accountPassword,
    homePath,
    nextStatus,
    approveButton,
    remark,
}) => {
    await loginAs(roleLabel, accountEmail, accountPassword, homePath);
    await page.getByRole('link', { name: 'Applications' }).click();
    await page.waitForURL((url) => url.pathname.endsWith('/applications'));

    const row = page.getByRole('row')
        .filter({ hasText: 'CivicTrack E2E Beneficiary' })
        .filter({ hasText: 'Farmer Subsidy Scheme' })
        .first();
    await row.waitFor({ state: 'visible' });
    await row.locator('button.action-btn').click();

    const dialog = page.getByRole('dialog', { name: 'Application Details' });
    await dialog.waitFor({ state: 'visible' });
    await dialog.locator('#remarks').fill(remark);
    await dialog.getByRole('button', { name: approveButton }).click();
    await dialog.waitFor({ state: 'hidden' });

    const refreshedRow = page.getByRole('row')
        .filter({ hasText: 'CivicTrack E2E Beneficiary' })
        .filter({ hasText: 'Farmer Subsidy Scheme' })
        .first();
    await refreshedRow.getByText(nextStatus, { exact: true }).waitFor({ state: 'visible' });
};

try {
    pageErrors.length = 0;
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

    await reviewApplication({
        roleLabel: 'Field Officer',
        accountEmail: 'field@govt.in',
        accountPassword: 'password123',
        homePath: '/field/dashboard',
        nextStatus: 'Pending District Officer',
        approveButton: 'Approve & Forward',
        remark: 'E2E field verification completed',
    });

    await reviewApplication({
        roleLabel: 'District Officer',
        accountEmail: 'district@govt.in',
        accountPassword: 'password123',
        homePath: '/district/dashboard',
        nextStatus: 'Pending Admin',
        approveButton: 'Approve & Forward',
        remark: 'E2E district review completed',
    });

    await reviewApplication({
        roleLabel: 'System Admin',
        accountEmail: 'admin@govt.in',
        accountPassword: 'password123',
        homePath: '/admin/dashboard',
        nextStatus: 'Approved',
        approveButton: 'Final Approve & Disburse',
        remark: 'E2E final approval completed',
    });

    await loginAs('Beneficiary', email, password, '/beneficiary/applications');
    const approvedApplication = page.locator('article')
        .filter({ hasText: 'Farmer Subsidy Scheme' })
        .first();
    await approvedApplication.getByText('Approved', { exact: true }).waitFor({ state: 'visible' });

    await page.goto(`${baseUrl}/beneficiary/notifications`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Notification Hub' }).waitFor({ state: 'visible' });
    await page.getByRole('heading', { name: 'Application approved' }).waitFor({ state: 'visible' });

    assert.deepEqual(pageErrors, [], 'The browser journey should not produce uncaught page errors');
    console.log('PASS: beneficiary registration, application submission, field review, district review, final admin approval, refreshed beneficiary status, and approval notification.');
} finally {
    await browser.close();
}

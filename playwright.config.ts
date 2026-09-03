import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Read environment variables dynamically based on Jenkins TARGET_ENV parameter.
 * Defaults to 'staging' if running locally without the parameter.
 */
const environment = process.env.TARGET_ENV || 'staging';

dotenv.config({
  path: path.resolve(__dirname, `.env.${environment}`)
});

console.log(`\n==================================================`);
console.log(`  TARGET ENVIRONMENT : [${environment.toUpperCase()}]`);
console.log(`  BASE URL           : [${process.env.BASE_URL}]`);
console.log(`==================================================\n`);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 4 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['html'],
    ['playwright-dashboard-reporter'],
    ['./playwright-dashboard-reporter/index.ts'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL resolved dynamically from the corresponding .env file */
    baseURL: process.env.BASE_URL,

    screenshot: 'only-on-failure',

    /* Collect trace when retrying or when test fails. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
  ],
});
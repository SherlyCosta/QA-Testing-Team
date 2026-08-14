# QA-Testing-Team

This repository is created to learn how automated tests are connected to CI/CD, how builds are set up and run, how test results are generated, and how to identify and troubleshoot common pipeline failures.

Setup
1. Clone the repository
git clone https://github.com/SherlyCosta/QA-Testing-Team.git
cd QA-Testing-Team
2. Install dependencies
npm install
3. Install Playwright browsers
npx playwright install


Run Tests

Run all Playwright tests:

npx playwright test

Run tests on a specific browser:

npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
View Test Report
npx playwright show-report


Current Project Structure
QA-Testing-Team/
├── tests/
│   └── example.spec.ts
├── .gitignore
├── package.json
├── package-lock.json
├── playwright.config.ts
└── README.md
Current Status

The initial Playwright TypeScript framework has been set up. Application-specific test suites and Jenkins integration will be added as the project progresses.
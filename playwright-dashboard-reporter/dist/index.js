"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const test_1 = require("@playwright/test");
const pdf_lib_1 = require("pdf-lib");
function getProjectLabel(name) {
    if (!name)
        return 'Default';
    const l = name.toLowerCase();
    if (l === 'chromium' || l.includes('chrome'))
        return 'Chrome';
    if (l === 'firefox')
        return 'Firefox';
    if (l === 'webkit' || l.includes('safari'))
        return 'WebKit';
    if (l === 'setup')
        return 'Setup';
    return name.replace(/\b\w/g, c => c.toUpperCase());
}
function stripAnsi(str) {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}
class CustomDashboardReporter {
    constructor(options) {
        this.suitesMap = new Map();
        this.failedTestsData = [];
        this.executedProjects = new Map();
        this.browserConfigs = new Map();
        this.stats = {
            passed: 0,
            failed: 0,
            flaky: 0,
            startTime: 0,
        };
        this.outputDir = 'playwright-custom-report';
        this.projectName = 'Playwright Tests';
        this.browserInfo = { name: 'Unknown', headless: 'Unknown', viewport: 'Unknown' };
        if (options === null || options === void 0 ? void 0 : options.outputDir)
            this.outputDir = options.outputDir;
        if (options === null || options === void 0 ? void 0 : options.projectName)
            this.projectName = options.projectName;
    }
    onBegin(config, suite) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        this.stats.startTime = Date.now();
        if (config.projects && config.projects.length > 0) {
            const p = config.projects[0];
            this.browserInfo.name = ((_a = p.use) === null || _a === void 0 ? void 0 : _a.browserName) || ((_b = p.use) === null || _b === void 0 ? void 0 : _b.defaultBrowserType) || p.name || 'Unknown';
            this.browserInfo.headless = ((_c = p.use) === null || _c === void 0 ? void 0 : _c.headless) !== false ? 'true' : 'false';
            this.browserInfo.viewport = ((_d = p.use) === null || _d === void 0 ? void 0 : _d.viewport) ? `${p.use.viewport.width}x${p.use.viewport.height}` : 'Unknown';
            for (const proj of config.projects) {
                this.browserConfigs.set(proj.name, {
                    name: ((_e = proj.use) === null || _e === void 0 ? void 0 : _e.browserName) || ((_f = proj.use) === null || _f === void 0 ? void 0 : _f.defaultBrowserType) || proj.name || 'Unknown',
                    headless: ((_g = proj.use) === null || _g === void 0 ? void 0 : _g.headless) !== false ? 'true' : 'false',
                    viewport: ((_h = proj.use) === null || _h === void 0 ? void 0 : _h.viewport) ? `${proj.use.viewport.width}x${proj.use.viewport.height}` : 'Unknown'
                });
            }
        }
    }
    onTestEnd(test, result) {
        var _a, _b, _c, _d, _e, _f;
        const rawProjectName = ((_b = (_a = test.parent) === null || _a === void 0 ? void 0 : _a.project()) === null || _b === void 0 ? void 0 : _b.name) || 'default';
        const projectLabel = getProjectLabel(rawProjectName);
        if (!this.executedProjects.has(rawProjectName)) {
            this.executedProjects.set(rawProjectName, { id: rawProjectName, name: projectLabel });
        }
        const suiteName = path.basename(test.location.file);
        const suiteKey = `${rawProjectName}:${suiteName}`;
        if (!this.suitesMap.has(suiteKey)) {
            this.suitesMap.set(suiteKey, {
                name: suiteName,
                file: test.location.file,
                project: rawProjectName,
                projectLabel: projectLabel,
                passed: 0,
                failed: 0,
                flaky: 0,
                tests: []
            });
        }
        const suiteData = this.suitesMap.get(suiteKey);
        // Determine exact status considering retries & flakiness
        const outcome = test.outcome();
        let finalStatus = 'passed';
        if (outcome === 'flaky') {
            finalStatus = 'flaky';
        }
        else if (outcome === 'unexpected' || result.status === 'failed' || result.status === 'timedOut') {
            finalStatus = 'failed';
        }
        // Clean previous retry attempts from stats
        const existingIndex = suiteData.tests.findIndex((t) => t.id === test.id);
        if (existingIndex >= 0) {
            const prev = suiteData.tests[existingIndex];
            if (prev.status === 'passed') {
                this.stats.passed--;
                suiteData.passed--;
            }
            else if (prev.status === 'failed') {
                this.stats.failed--;
                suiteData.failed--;
            }
            else if (prev.status === 'flaky') {
                this.stats.flaky--;
                suiteData.flaky--;
            }
            suiteData.tests.splice(existingIndex, 1);
            this.failedTestsData = this.failedTestsData.filter(f => f.id !== test.id);
        }
        suiteData.tests.push({
            id: test.id,
            title: test.title,
            status: finalStatus,
            duration: `${(result.duration / 1000).toFixed(1)}s`,
            durationMs: result.duration,
            project: rawProjectName,
            projectLabel: projectLabel
        });
        if (finalStatus === 'passed') {
            this.stats.passed++;
            suiteData.passed++;
        }
        else if (finalStatus === 'flaky') {
            this.stats.flaky++;
            suiteData.flaky++;
        }
        else if (finalStatus === 'failed') {
            this.stats.failed++;
            suiteData.failed++;
            // Screenshot extraction
            const screenshot = result.attachments.find(a => a.name === 'screenshot' || (a.contentType && a.contentType.includes('image')));
            let screenshotBase64 = '';
            if (screenshot && screenshot.path && fs.existsSync(screenshot.path)) {
                const ext = path.extname(screenshot.path).replace('.', '');
                screenshotBase64 = `data:image/${ext || 'png'};base64,${fs.readFileSync(screenshot.path, 'base64')}`;
            }
            else if (screenshot && screenshot.body) {
                screenshotBase64 = `data:image/png;base64,${screenshot.body.toString('base64')}`;
            }
            // Clean error & stack trace
            let rawError = ((_c = result.error) === null || _c === void 0 ? void 0 : _c.message) || ((_d = result.error) === null || _d === void 0 ? void 0 : _d.value) || 'Test failed without error description';
            if (result.errors && result.errors.length > 0) {
                rawError = result.errors.map(e => e.message).join('\n\n');
            }
            const cleanError = stripAnsi(rawError);
            const cleanStack = stripAnsi(((_e = result.error) === null || _e === void 0 ? void 0 : _e.stack) || ((_f = result.errors) === null || _f === void 0 ? void 0 : _f.map(e => e.stack).join('\n\n')) || '');
            // Extract failed step
            const findFailedStep = (steps) => {
                for (const s of steps) {
                    if (s.error)
                        return s.title;
                    if (s.steps && s.steps.length > 0) {
                        const nested = findFailedStep(s.steps);
                        if (nested)
                            return nested;
                    }
                }
                return 'Execution / Timeout';
            };
            const failedStep = findFailedStep(result.steps || []);
            // Extract Expected / Actual
            let expected = 'N/A';
            let actual = 'N/A';
            const expMatch = cleanError.match(/Expected:\s*([\s\S]*?)(?=\n\s*Received:|\n\s*Actual:|$)/i);
            const actMatch = cleanError.match(/(?:Received|Actual):\s*([\s\S]*?)(?=\n\s*Call log:|\n\s*at |$)/i);
            if (expMatch)
                expected = expMatch[1].trim();
            if (actMatch)
                actual = actMatch[1].trim();
            // Extract trace attachment
            const traceAttachment = result.attachments.find(a => a.name === 'trace' || (a.path && a.path.endsWith('.zip')));
            let traceCommand = 'N/A';
            if (traceAttachment && traceAttachment.path) {
                const relTracePath = path.relative(process.cwd(), traceAttachment.path);
                traceCommand = `npx playwright show-trace ${relTracePath}`;
            }
            // Extract Developer-Friendly Summary
            let developerSummary = cleanError;
            const defectMatch = cleanError.match(/DEFECT:\s*([^\n]+)/i);
            if (defectMatch) {
                developerSummary = `DEFECT: ${defectMatch[1].trim()}`;
            }
            else {
                const firstLine = cleanError.split('\n')[0].trim();
                developerSummary = firstLine || 'Test assertion expectation failed';
            }
            // Format Jira Markdown ticket body
            const relFilePath = path.relative(process.cwd(), test.location.file);
            const jiraMarkdown = `h2. Bug Report: ${test.title}

*Test Specification:* ${suiteName}
*Test File:* ${relFilePath}:${test.location.line}
*Environment:* ${projectLabel} (${process.platform}, Node ${process.version})
*Execution Time:* ${(result.duration / 1000).toFixed(1)}s

h3. Failed Step
${failedStep}

h3. Developer Failure Summary
${developerSummary}

h3. Expected vs Actual Result
* *Expected Result:* ${expected}
* *Actual Result:* ${actual}

h3. Error Details
{code}
${cleanError.substring(0, 1200)}
{code}

h3. Interactive Trace Command
{code:bash}
${traceCommand}
{code}`;
            this.failedTestsData.push({
                id: test.id,
                name: test.title,
                file: `${relFilePath}:${test.location.line}`,
                status: 'failed',
                duration: `${(result.duration / 1000).toFixed(1)}s`,
                failedStep,
                developerSummary,
                expected,
                actual,
                error: cleanError,
                stackTrace: cleanStack,
                screenshot: screenshotBase64,
                traceCommand,
                jiraMarkdown,
                project: rawProjectName,
                projectLabel: projectLabel
            });
        }
    }
    onEnd(result) {
        return __awaiter(this, void 0, void 0, function* () {
            const totalDurationMs = Date.now() - this.stats.startTime;
            const totalDurationStr = `${Math.floor(totalDurationMs / 60000)}m ${Math.floor((totalDurationMs % 60000) / 1000)}s`;
            const total = this.stats.passed + this.stats.failed + this.stats.flaky;
            const passRate = total > 0 ? Math.round((this.stats.passed / total) * 100) : 0;
            const absOutputDir = path.resolve(this.outputDir);
            if (!fs.existsSync(absOutputDir)) {
                fs.mkdirSync(absOutputDir, { recursive: true });
            }
            const historyFile = path.join(absOutputDir, 'run-history.json');
            let history = [];
            if (fs.existsSync(historyFile)) {
                try {
                    history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
                }
                catch (e) { }
            }
            history.push(passRate);
            if (history.length > 10)
                history = history.slice(history.length - 10);
            fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
            // Extract Git branch if not provided by Jenkins BRANCH env var
            let branch = (process.env.BRANCH || process.env.GIT_BRANCH || '').trim();
            if (!branch) {
                try {
                    const { execSync } = require('child_process');
                    branch = execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
                }
                catch (e) {
                    branch = 'main';
                }
            }
            // Determine OS friendly display
            let osLabel = process.platform;
            if (process.platform === 'win32')
                osLabel = 'Windows';
            else if (process.platform === 'darwin')
                osLabel = 'macOS';
            else if (process.platform === 'linux')
                osLabel = 'Linux';
            const testSuite = (process.env.TEST_SUITE || 'All').trim();
            const browserParam = (process.env.BROWSER || 'All').trim();
            const targetEnv = (process.env.TARGET_ENV || process.env.ENVIRONMENT || 'staging').trim();
            const baseUrl = (process.env.BASE_URL || '').trim();
            const buildNumber = process.env.BUILD_NUMBER ? `#${process.env.BUILD_NUMBER}` : 'Local Run';
            const jobName = process.env.JOB_NAME || '';
            const buildUrl = process.env.BUILD_URL || '';
            const parameters = {
                testSuite,
                browser: browserParam,
                branch: branch || 'main',
                environment: targetEnv,
                baseUrl: baseUrl || 'N/A',
                buildNumber,
                jobName,
                buildUrl
            };
            const reportData = {
                summary: {
                    passed: this.stats.passed,
                    failed: this.stats.failed,
                    flaky: this.stats.flaky,
                    totalDuration: totalDurationStr,
                    passRate: `${passRate}%`
                },
                parameters,
                projects: Array.from(this.executedProjects.values()),
                browserConfigs: Object.fromEntries(this.browserConfigs.entries()),
                trend: history,
                suites: Array.from(this.suitesMap.values()),
                failedTests: this.failedTestsData,
                environment: {
                    testSuite,
                    environment: targetEnv.toUpperCase(),
                    baseUrl: baseUrl || 'N/A',
                    branch: branch || 'main',
                    browser: browserParam,
                    buildNumber,
                    os: osLabel,
                    node: process.version,
                    playwright: require('@playwright/test/package.json').version || 'Unknown',
                },
                browser: this.browserInfo,
                logs: []
            };
            const templatePath = path.join(__dirname, 'reporter-template.html');
            let htmlContent = fs.readFileSync(templatePath, 'utf-8');
            const safeJson = JSON.stringify(reportData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
            const dataScript = `<script id="report-data">window.__REPORT_DATA__ = ${safeJson};</script>`;
            if (htmlContent.includes('<script id="report-data">')) {
                htmlContent = htmlContent.replace(/<script id="report-data">[\s\S]*?<\/script>/, dataScript);
            }
            else {
                htmlContent = htmlContent.replace('</body>', `${dataScript}\n</body>`);
            }
            const outPath = path.join(absOutputDir, 'dashboard.html');
            fs.writeFileSync(outPath, htmlContent);
            console.log(`Custom Dashboard Report generated at: ${outPath}`);
            yield this.generatePdf(outPath, path.join(absOutputDir, 'test-report.pdf'));
        });
    }
    generatePdf(reportPath, finalPdfPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let browser;
            try {
                browser = yield test_1.chromium.launch({ headless: true });
                const page = yield browser.newPage({ viewport: { width: 1440, height: 900 } });
                yield page.goto(`file://${reportPath}`, { waitUntil: 'networkidle' });
                yield page.emulateMedia({ media: 'screen' });
                yield page.waitForTimeout(800);
                const tabButtons = page.locator('.browser-tabs button, [role="tab"]');
                const tabCount = yield tabButtons.count();
                const mergedPdf = yield pdf_lib_1.PDFDocument.create();
                const capture = () => __awaiter(this, void 0, void 0, function* () {
                    yield page.evaluate(() => {
                        document.querySelectorAll('.suite-tests').forEach(el => el.style.display = 'block');
                        document.querySelectorAll('.error-screenshot img').forEach(img => {
                            img.style.display = 'block';
                            img.style.maxHeight = '420px';
                        });
                    });
                    yield page.waitForTimeout(500);
                    const fullHeight = yield page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
                    return yield page.pdf({
                        width: '1440px',
                        height: `${fullHeight + 50}px`,
                        printBackground: true,
                        preferCSSPageSize: false,
                        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
                    });
                });
                if (tabCount === 0) {
                    const pdfBuffer = yield capture();
                    fs.writeFileSync(finalPdfPath, pdfBuffer);
                }
                else {
                    for (let i = 0; i < tabCount; i++) {
                        yield tabButtons.nth(i).click();
                        yield page.waitForTimeout(500);
                        const buf = yield capture();
                        const doc = yield pdf_lib_1.PDFDocument.load(buf);
                        const pages = yield mergedPdf.copyPages(doc, doc.getPageIndices());
                        pages.forEach(p => mergedPdf.addPage(p));
                    }
                    fs.writeFileSync(finalPdfPath, yield mergedPdf.save());
                }
                console.log(`PDF test report generated successfully: ${finalPdfPath}`);
            }
            catch (e) {
                console.error('PDF export failed:', e);
            }
            finally {
                if (browser)
                    yield browser.close();
            }
        });
    }
}
exports.default = CustomDashboardReporter;

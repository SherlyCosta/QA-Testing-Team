import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

interface CustomReporterOptions {
  projectName?: string;
  outputDir?: string;
}

function getProjectLabel(name: string): string {
  if (!name) return 'Default';
  const l = name.toLowerCase();
  if (l === 'chromium' || l.includes('chrome')) return 'Chrome';
  if (l === 'firefox') return 'Firefox';
  if (l === 'webkit' || l.includes('safari')) return 'WebKit';
  if (l === 'setup') return 'Setup';
  return name.replace(/\b\w/g, c => c.toUpperCase());
}

function stripAnsi(str: string): string {
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

class CustomDashboardReporter implements Reporter {
  private suitesMap: Map<string, any> = new Map();
  private failedTestsData: any[] = [];
  private executedProjects: Map<string, { id: string, name: string }> = new Map();
  private browserConfigs: Map<string, { name: string, headless: string, viewport: string }> = new Map();
  private stats = {
    passed: 0,
    failed: 0,
    flaky: 0,
    startTime: 0,
  };
  private outputDir = 'playwright-custom-report';
  private projectName = 'Playwright Tests';
  private browserInfo = { name: 'Unknown', headless: 'Unknown', viewport: 'Unknown' };

  constructor(options?: CustomReporterOptions) {
    if (options?.outputDir) this.outputDir = options.outputDir;
    if (options?.projectName) this.projectName = options.projectName;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.stats.startTime = Date.now();

    if (config.projects && config.projects.length > 0) {
      const p = config.projects[0];
      this.browserInfo.name = p.use?.browserName || p.use?.defaultBrowserType || p.name || 'Unknown';
      this.browserInfo.headless = p.use?.headless !== false ? 'true' : 'false';
      this.browserInfo.viewport = p.use?.viewport ? `${p.use.viewport.width}x${p.use.viewport.height}` : 'Unknown';

      for (const proj of config.projects) {
        this.browserConfigs.set(proj.name, {
          name: proj.use?.browserName || proj.use?.defaultBrowserType || proj.name || 'Unknown',
          headless: proj.use?.headless !== false ? 'true' : 'false',
          viewport: proj.use?.viewport ? `${proj.use.viewport.width}x${proj.use.viewport.height}` : 'Unknown'
        });
      }
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const rawProjectName = test.parent?.project()?.name || 'default';
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
    let finalStatus: 'passed' | 'failed' | 'flaky' = 'passed';

    if (outcome === 'flaky') {
      finalStatus = 'flaky';
    } else if (outcome === 'unexpected' || result.status === 'failed' || result.status === 'timedOut') {
      finalStatus = 'failed';
    }

    // Clean previous retry attempts from stats
    const existingIndex = suiteData.tests.findIndex((t: any) => t.id === test.id);
    if (existingIndex >= 0) {
      const prev = suiteData.tests[existingIndex];
      if (prev.status === 'passed') { this.stats.passed--; suiteData.passed--; }
      else if (prev.status === 'failed') { this.stats.failed--; suiteData.failed--; }
      else if (prev.status === 'flaky') { this.stats.flaky--; suiteData.flaky--; }
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
    } else if (finalStatus === 'flaky') {
      this.stats.flaky++;
      suiteData.flaky++;
    } else if (finalStatus === 'failed') {
      this.stats.failed++;
      suiteData.failed++;

      // Screenshot extraction
      const screenshot = result.attachments.find(a => a.name === 'screenshot' || (a.contentType && a.contentType.includes('image')));
      let screenshotBase64 = '';
      if (screenshot && screenshot.path && fs.existsSync(screenshot.path)) {
        const ext = path.extname(screenshot.path).replace('.', '');
        screenshotBase64 = `data:image/${ext || 'png'};base64,${fs.readFileSync(screenshot.path, 'base64')}`;
      } else if (screenshot && screenshot.body) {
        screenshotBase64 = `data:image/png;base64,${screenshot.body.toString('base64')}`;
      }

      // Clean error & stack trace
      let rawError = result.error?.message || result.error?.value || 'Test failed without error description';
      if (result.errors && result.errors.length > 0) {
        rawError = result.errors.map(e => e.message).join('\n\n');
      }
      const cleanError = stripAnsi(rawError);
      const cleanStack = stripAnsi(result.error?.stack || result.errors?.map(e => e.stack).join('\n\n') || '');

      // Extract failed step
      const findFailedStep = (steps: any[]): string => {
        for (const s of steps) {
          if (s.error) return s.title;
          if (s.steps && s.steps.length > 0) {
            const nested = findFailedStep(s.steps);
            if (nested) return nested;
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
      if (expMatch) expected = expMatch[1].trim();
      if (actMatch) actual = actMatch[1].trim();

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
      } else {
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

  async onEnd(result: FullResult) {
    const totalDurationMs = Date.now() - this.stats.startTime;
    const totalDurationStr = `${Math.floor(totalDurationMs / 60000)}m ${Math.floor((totalDurationMs % 60000) / 1000)}s`;
    const total = this.stats.passed + this.stats.failed + this.stats.flaky;
    const passRate = total > 0 ? Math.round((this.stats.passed / total) * 100) : 0;

    const absOutputDir = path.resolve(this.outputDir);
    if (!fs.existsSync(absOutputDir)) {
      fs.mkdirSync(absOutputDir, { recursive: true });
    }

    const historyFile = path.join(absOutputDir, 'run-history.json');
    let history: number[] = [];
    if (fs.existsSync(historyFile)) {
      try { history = JSON.parse(fs.readFileSync(historyFile, 'utf-8')); } catch (e) { }
    }
    history.push(passRate);
    if (history.length > 10) history = history.slice(history.length - 10);
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));

    const reportData = {
      summary: {
        passed: this.stats.passed,
        failed: this.stats.failed,
        flaky: this.stats.flaky,
        totalDuration: totalDurationStr,
        passRate: `${passRate}%`
      },
      projects: Array.from(this.executedProjects.values()),
      browserConfigs: Object.fromEntries(this.browserConfigs.entries()),
      trend: history,
      suites: Array.from(this.suitesMap.values()),
      failedTests: this.failedTestsData,
      environment: {
        os: process.platform,
        node: process.version,
        playwright: require('@playwright/test/package.json').version || 'Unknown',
        project: this.projectName
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
    } else {
      htmlContent = htmlContent.replace('</body>', `${dataScript}\n</body>`);
    }

    const outPath = path.join(absOutputDir, 'dashboard.html');
    fs.writeFileSync(outPath, htmlContent);
    console.log(`Custom Dashboard Report generated at: ${outPath}`);

    await this.generatePdf(outPath, path.join(absOutputDir, 'test-report.pdf'));
  }

  private async generatePdf(reportPath: string, finalPdfPath: string) {
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

      await page.goto(`file://${reportPath}`, { waitUntil: 'networkidle' });
      await page.emulateMedia({ media: 'screen' });
      await page.waitForTimeout(800);

      const tabButtons = page.locator('.browser-tabs button, [role="tab"]');
      const tabCount = await tabButtons.count();
      const mergedPdf = await PDFDocument.create();

      const capture = async (): Promise<Buffer> => {
        await page.evaluate(() => {
          document.querySelectorAll('.suite-tests').forEach(el => (el as HTMLElement).style.display = 'block');
          document.querySelectorAll('.error-screenshot img').forEach(img => {
            (img as HTMLElement).style.display = 'block';
            (img as HTMLElement).style.maxHeight = '420px';
          });
        });

        await page.waitForTimeout(500);
        const fullHeight = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));

        return await page.pdf({
          width: '1440px',
          height: `${fullHeight + 50}px`,
          printBackground: true,
          preferCSSPageSize: false,
          margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
        });
      };

      if (tabCount === 0) {
        const pdfBuffer = await capture();
        fs.writeFileSync(finalPdfPath, pdfBuffer);
      } else {
        for (let i = 0; i < tabCount; i++) {
          await tabButtons.nth(i).click();
          await page.waitForTimeout(500);
          const buf = await capture();
          const doc = await PDFDocument.load(buf);
          const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
          pages.forEach(p => mergedPdf.addPage(p));
        }
        fs.writeFileSync(finalPdfPath, await mergedPdf.save());
      }
      console.log(`PDF test report generated successfully: ${finalPdfPath}`);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      if (browser) await browser.close();
    }
  }
}

export default CustomDashboardReporter;

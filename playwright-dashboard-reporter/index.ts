import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestError
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

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

class CustomDashboardReporter implements Reporter {
  private suitesMap: Map<string, any> = new Map();
  private failedTestsData: any[] = [];
  private executedProjects: Map<string, { id: string, name: string }> = new Map();
  private browserConfigs: Map<string, { name: string, headless: string, viewport: string }> = new Map();
  private stats = {
    passed: 0,
    failed: 0,
    skipped: 0,
    startTime: 0,
  };
  private outputDir = 'playwright-custom-report';
  private projectName = 'Playwright Tests';
  private browserInfo = { name: 'Unknown', headless: 'Unknown', viewport: 'Unknown' };

  constructor(options?: CustomReporterOptions) {
    if (options?.outputDir) {
      this.outputDir = options.outputDir;
    }
    if (options?.projectName) {
      this.projectName = options.projectName;
    }
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.stats.startTime = Date.now();
    console.log(`Starting the run with ${suite.allTests().length} tests`);

    if (config.projects && config.projects.length > 0) {
      const p = config.projects[0];
      this.browserInfo.name = p.use?.browserName || p.use?.defaultBrowserType || p.name || 'Unknown';
      this.browserInfo.headless = p.use?.headless !== false ? 'true' : 'false';
      this.browserInfo.viewport = p.use?.viewport ? `${p.use.viewport.width}x${p.use.viewport.height}` : 'Unknown';

      for (const proj of config.projects) {
        const bName = proj.use?.browserName || proj.use?.defaultBrowserType || proj.name || 'Unknown';
        const headless = proj.use?.headless !== false ? 'true' : 'false';
        const viewport = proj.use?.viewport ? `${proj.use.viewport.width}x${proj.use.viewport.height}` : 'Unknown';
        this.browserConfigs.set(proj.name, {
          name: bName,
          headless,
          viewport
        });
      }
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const rawProjectName = test.parent?.project()?.name || 'default';
    const projectLabel = getProjectLabel(rawProjectName);

    if (!this.executedProjects.has(rawProjectName)) {
      this.executedProjects.set(rawProjectName, {
        id: rawProjectName,
        name: projectLabel
      });
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
        skipped: 0,
        tests: []
      });
    }
    const suiteData = this.suitesMap.get(suiteKey);

    let prevScreenshot = '';
    // Handle retries: remove previous attempt stats and records if this is a retry
    const existingIndex = suiteData.tests.findIndex((t: any) => t.id === test.id);
    if (existingIndex >= 0) {
      const prevTest = suiteData.tests[existingIndex];
      if (prevTest.status === 'passed') {
        this.stats.passed--; suiteData.passed--;
      } else if (prevTest.status === 'failed' || prevTest.status === 'timedOut') {
        this.stats.failed--; suiteData.failed--;
        const prevFailed = this.failedTestsData.find(f => f.id === test.id);
        if (prevFailed && prevFailed.screenshot) {
          prevScreenshot = prevFailed.screenshot;
        }
        this.failedTestsData = this.failedTestsData.filter(f => f.id !== test.id);
      } else if (prevTest.status === 'skipped') {
        this.stats.skipped--; suiteData.skipped--;
      }
      suiteData.tests.splice(existingIndex, 1);
    }

    suiteData.tests.push({
      id: test.id,
      title: test.title,
      status: result.status,
      duration: `${(result.duration / 1000).toFixed(1)}s`,
      durationMs: result.duration,
      project: rawProjectName,
      projectLabel: projectLabel
    });

    if (result.status === 'passed') {
      this.stats.passed++;
      suiteData.passed++;
    } else if (result.status === 'failed' || result.status === 'timedOut') {
      this.stats.failed++;
      suiteData.failed++;
      
      // Collect failure details
      const screenshot = result.attachments.find(a => a.name === 'screenshot' || (a.contentType && a.contentType.includes('image')));
      let screenshotBase64 = '';
      if (screenshot && screenshot.path && fs.existsSync(screenshot.path)) {
        const ext = path.extname(screenshot.path).replace('.', '');
        const b64 = fs.readFileSync(screenshot.path, 'base64');
        screenshotBase64 = `data:image/${ext || 'png'};base64,${b64}`;
      } else if (screenshot && screenshot.body) {
        screenshotBase64 = `data:image/png;base64,${screenshot.body.toString('base64')}`;
      }

      let errorMsg = 'Unknown error';
      let stackTrace = '';
      if (result.error) {
         errorMsg = result.error.message || result.error.value || 'Error';
         stackTrace = result.error.stack || '';
      } else if (result.errors && result.errors.length > 0) {
         errorMsg = result.errors.map(e => e.message).join('\n\n');
         stackTrace = result.errors.map(e => e.stack).join('\n\n');
      }

      this.failedTestsData.push({
        id: test.id,
        name: test.title,
        file: `${test.location.file}:${test.location.line}`,
        status: 'failed',
        duration: `${(result.duration / 1000).toFixed(1)}s`,
        error: errorMsg,
        stackTrace: stackTrace,
        screenshot: screenshotBase64 || prevScreenshot,
        project: rawProjectName,
        projectLabel: projectLabel
      });

    } else if (result.status === 'skipped') {
      this.stats.skipped++;
      suiteData.skipped++;
    }
  }

  async onEnd(result: FullResult) {
    const totalDurationMs = Date.now() - this.stats.startTime;
    const totalDurationStr = `${Math.floor(totalDurationMs / 60000)}m ${Math.floor((totalDurationMs % 60000) / 1000)}s`;
    const total = this.stats.passed + this.stats.failed + this.stats.skipped;
    const passRate = total > 0 ? Math.round((this.stats.passed / total) * 100) : 0;

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Load or initialize history
    const historyFile = path.join(this.outputDir, 'run-history.json');
    let history: number[] = [];
    if (fs.existsSync(historyFile)) {
      try {
        history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
      } catch (e) { }
    }
    history.push(passRate);
    if (history.length > 10) history = history.slice(history.length - 10);
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));

    const reportData = {
      summary: {
        passed: this.stats.passed,
        failed: this.stats.failed,
        skipped: this.stats.skipped,
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
    
    // Inject the data
    const dataScript = `<script id="report-data">window.__REPORT_DATA__ = ${JSON.stringify(reportData)};</script>`;
    if (htmlContent.includes('<script id="report-data">')) {
      htmlContent = htmlContent.replace(/<script id="report-data">[\s\S]*?<\/script>/, dataScript);
    } else {
      htmlContent = htmlContent.replace('</body>', `${dataScript}\n</body>`);
    }

    const outPath = path.join(this.outputDir, 'dashboard.html');
    fs.writeFileSync(outPath, htmlContent);
    console.log(`Custom Dashboard Report generated at: ${outPath}`);
  }
}

export default CustomDashboardReporter;

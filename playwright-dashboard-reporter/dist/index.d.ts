import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
interface CustomReporterOptions {
    projectName?: string;
    outputDir?: string;
}
declare class CustomDashboardReporter implements Reporter {
    private suitesMap;
    private failedTestsData;
    private executedProjects;
    private browserConfigs;
    private stats;
    private outputDir;
    private projectName;
    private browserInfo;
    constructor(options?: CustomReporterOptions);
    onBegin(config: FullConfig, suite: Suite): void;
    onTestEnd(test: TestCase, result: TestResult): void;
    onEnd(result: FullResult): Promise<void>;
}
export default CustomDashboardReporter;

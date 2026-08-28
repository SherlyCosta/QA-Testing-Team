import { expect } from '@playwright/test';

export interface DefectReport {
  bugTitle: string;
  module: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  expectedResult: string;
  actualResult: string;
}

export class CustomAssertions {
  static formatDefectReport(report: DefectReport): string {
    return [
      `\n---------------------------------------------------------`,
      `DEFECT REPORT: ${report.bugTitle}`,
      `Module: ${report.module}`,
      `Severity: ${report.severity}`,
      `Expected Result: ${report.expectedResult}`,
      `Actual Result:   ${report.actualResult}`,
      `---------------------------------------------------------`,
    ].filter(Boolean).join('\n');
  }

  static assertBusinessRule(condition: boolean, report: DefectReport): void {
    const formattedMessage = this.formatDefectReport(report);
    expect(condition, formattedMessage).toBeTruthy();
  }
}

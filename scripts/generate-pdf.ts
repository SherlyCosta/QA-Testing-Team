// generate-pdf.ts
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

export async function generatePdf() {
    const reportPath = path.resolve('playwright-custom-report/dashboard.html');
    const finalPdfPath = path.resolve('playwright-custom-report/test-report.pdf');

    // 1. Ensure report folder exists
    const reportDir = path.dirname(finalPdfPath);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    // 2. Poll until dashboard.html is completely written to disk
    let retries = 20;
    while (retries > 0) {
        if (fs.existsSync(reportPath) && fs.statSync(reportPath).size > 0) {
            break;
        }
        await new Promise((r) => setTimeout(r, 500));
        retries--;
    }

    if (!fs.existsSync(reportPath)) {
        throw new Error(`Dashboard file not found after waiting: ${reportPath}`);
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width: 1440, height: 900 }
    });

    try {
        await page.goto(`file://${reportPath}`, { waitUntil: 'networkidle' });
        await page.emulateMedia({ media: 'screen' });
        await page.waitForTimeout(1000);

        const tabButtons = page.locator('.browser-tabs button, .browser-tab-btn');
        const tabCount = await tabButtons.count();

        const mergedPdf = await PDFDocument.create();

        const expandSuitesAndCapture = async (): Promise<Buffer> => {
            // Expand all test suites and render all failed test errors directly in the DOM for PDF
            await page.evaluate(`
                (function() {
                    var allElements = Array.from(document.querySelectorAll('*'));
                    var suiteHeaders = allElements.filter(function(el) {
                        var text = el.textContent || '';
                        var hasFilename = text.includes('.spec.ts') || text.includes('.setup.ts');
                        return (
                            hasFilename &&
                            el.children.length <= 6 &&
                            (el.classList.toString().includes('suite') ||
                                el.classList.toString().includes('header') ||
                                el.tagName === 'DIV')
                        );
                    });

                    suiteHeaders.forEach(function(header) {
                        header.click();
                    });

                    // Force display of nested test rows/details
                    document
                        .querySelectorAll('[style*="display: none"], .test-items, .suite-content, .suite-body')
                        .forEach(function(el) {
                            if (!el.classList.contains('modal')) {
                                el.style.display = 'block';
                                el.style.visibility = 'visible';
                                el.style.maxHeight = 'none';
                                el.style.height = 'auto';
                            }
                        });

                    // Render all failed test error details sequentially for PDF output
                    var reportData = window.__REPORT_DATA__;
                    var failedSection = document.getElementById('failed-section');
                    var failedContent = failedSection ? failedSection.querySelector('.failed-content') : null;

                    if (reportData && failedSection && failedContent) {
                        var activeTabBtn = document.querySelector('.browser-tab-btn.active');
                        var activeProjectId = activeTabBtn ? activeTabBtn.getAttribute('data-project') : null;

                        var projects = reportData.projects || [];
                        var isSingleOrAll = projects.length <= 1 || activeProjectId === 'all' || !activeProjectId;

                        var failedTests = (reportData.failedTests || []).filter(function(f) {
                            if (!activeProjectId || activeProjectId === 'all') return true;
                            return f.project === activeProjectId || (isSingleOrAll && !f.project);
                        });

                        if (failedTests.length > 0) {
                            failedSection.style.display = 'block';
                            failedSection.classList.remove('hidden');

                            function escapeHtml(str) {
                                if (!str || typeof str !== 'string') return str || '';
                                return str
                                    .replace(/&/g, '&amp;')
                                    .replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/"/g, '&quot;')
                                    .replace(/'/g, '&#039;');
                            }

                            var pdfFailedHtml = '<div style="display: flex; flex-direction: column; gap: 20px; width: 100%; padding: 20px; box-sizing: border-box;">';

                            failedTests.forEach(function(test, idx) {
                                var errorText = escapeHtml(test.error || test.developerSummary || 'No error message available');
                                var screenshotSrc = test.screenshot || '';

                                pdfFailedHtml += '' +
                                    '<div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; background: var(--card-bg); box-shadow: var(--shadow);">' +
                                        '<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">' +
                                            '<div>' +
                                                '<div style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin-bottom: 6px; display: flex; align-items: center; gap: 10px;">' +
                                                    '<span>#' + (idx + 1) + '. ' + escapeHtml(test.name) + '</span>' +
                                                    '<span class="badge-fail">Failed</span>' +
                                                '</div>' +
                                                '<div style="font-size: 0.82rem; color: var(--text-muted); font-family: var(--mono-font); background: var(--subrow-bg); padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color); display: inline-block;">' +
                                                    '<i class="fa-regular fa-file-code"></i> ' + escapeHtml(test.file) +
                                                '</div>' +
                                            '</div>' +
                                            '<div style="color: var(--text-muted); font-size: 0.85rem; white-space: nowrap;">' +
                                                '<i class="fa-regular fa-clock"></i> ' + escapeHtml(test.duration) +
                                            '</div>' +
                                        '</div>' +

                                        '<div style="margin-top: 12px;">' +
                                            '<div style="font-size: 0.88rem; font-weight: 600; color: var(--fail-color); margin-bottom: 8px;">' +
                                                '<i class="fa-solid fa-circle-exclamation"></i> Error Details' +
                                            '</div>' +
                                            '<pre style="margin: 0; font-size: 0.85rem; color: var(--text-main); background: var(--code-bg); padding: 16px; border-radius: 6px; border: 1px solid var(--border-color); white-space: pre-wrap; word-wrap: break-word; font-family: var(--mono-font); line-height: 1.5; max-height: none; overflow: visible;">' + errorText + '</pre>' +
                                        '</div>' +

                                        (screenshotSrc ?
                                        '<div style="margin-top: 14px;">' +
                                            '<div style="font-size: 0.88rem; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">' +
                                                '<i class="fa-solid fa-camera"></i> Screenshot' +
                                            '</div>' +
                                            '<div style="background: var(--code-bg); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color); text-align: center;">' +
                                                '<img src="' + screenshotSrc + '" style="max-width: 100%; height: auto; max-height: 450px; border-radius: 6px; box-shadow: var(--shadow);" alt="Error Screenshot" />' +
                                            '</div>' +
                                        '</div>'
                                        : '') +
                                    '</div>';
                            });

                            pdfFailedHtml += '</div>';

                            failedContent.innerHTML = pdfFailedHtml;
                            failedContent.style.minHeight = 'auto';
                            failedContent.style.maxHeight = 'none';
                            failedContent.style.height = 'auto';
                            failedContent.style.overflow = 'visible';

                            failedSection.style.maxHeight = 'none';
                            failedSection.style.height = 'auto';
                            failedSection.style.overflow = 'visible';
                        } else {
                            failedSection.style.display = 'none';
                        }
                    }
                })()
            `);

            await page.waitForTimeout(800);

            const fullHeight = (await page.evaluate(`
                (function() {
                    var body = document.body;
                    var html = document.documentElement;
                    return Math.max(
                        body.scrollHeight,
                        body.offsetHeight,
                        html.clientHeight,
                        html.scrollHeight,
                        html.offsetHeight
                    );
                })()
            `)) as number;

            return await page.pdf({
                width: '1440px',
                height: `${fullHeight + 60}px`,
                printBackground: true,
                preferCSSPageSize: false,
                margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
            });
        };

        if (tabCount === 0) {
            const pdfBuffer = await expandSuitesAndCapture();
            fs.writeFileSync(finalPdfPath, pdfBuffer);
        } else {
            for (let i = 0; i < tabCount; i++) {
                const tab = tabButtons.nth(i);
                await tab.click();
                await page.waitForTimeout(800);

                const tabPdfBuffer = await expandSuitesAndCapture();
                const tempDoc = await PDFDocument.load(tabPdfBuffer);
                const copiedPages = await mergedPdf.copyPages(tempDoc, tempDoc.getPageIndices());
                copiedPages.forEach((p) => mergedPdf.addPage(p));
            }

            const mergedPdfBytes = await mergedPdf.save();
            fs.writeFileSync(finalPdfPath, mergedPdfBytes);
        }

        console.log(`[PDF Reporter] PDF generated at: ${finalPdfPath}`);
    } finally {
        await browser.close();
    }
}

if (require.main === module || (process.argv[1] && process.argv[1].includes('generate-pdf'))) {
    generatePdf().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
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

        const tabButtons = page.locator(
            '.tabs button, .browser-tabs button, [role="tab"], button:has-text("Setup"), button:has-text("Chrome"), button:has-text("Firefox"), button:has-text("WebKit")'
        );
        const tabCount = await tabButtons.count();

        const mergedPdf = await PDFDocument.create();

        const expandSuitesAndCapture = async (): Promise<Buffer> => {
            // Expand all test suites directly in the DOM
            await page.evaluate(() => {
                const allElements = Array.from(document.querySelectorAll('*'));
                const suiteHeaders = allElements.filter((el) => {
                    const text = el.textContent || '';
                    const hasFilename = text.includes('.spec.ts') || text.includes('.setup.ts');
                    return (
                        hasFilename &&
                        el.children.length <= 6 &&
                        (el.classList.toString().includes('suite') ||
                            el.classList.toString().includes('header') ||
                            el.tagName === 'DIV')
                    );
                });

                suiteHeaders.forEach((header) => {
                    (header as HTMLElement).click();
                });

                // Force display of nested test rows/details
                document
                    .querySelectorAll('[style*="display: none"], .test-items, .suite-content, .suite-body')
                    .forEach((el) => {
                        const htmlEl = el as HTMLElement;
                        if (!htmlEl.classList.contains('modal')) {
                            htmlEl.style.display = 'block';
                            htmlEl.style.visibility = 'visible';
                            htmlEl.style.maxHeight = 'none';
                            htmlEl.style.height = 'auto';
                        }
                    });
            });

            await page.waitForTimeout(800);

            const fullHeight = await page.evaluate(() => {
                const body = document.body;
                const html = document.documentElement;
                return Math.max(
                    body.scrollHeight,
                    body.offsetHeight,
                    html.clientHeight,
                    html.scrollHeight,
                    html.offsetHeight
                );
            });

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
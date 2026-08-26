import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function generatePdf() {
    const reportPath = path.resolve('playwright-custom-report/dashboard.html');
    const finalPdfPath = path.resolve('playwright-custom-report/test-report.pdf');

    if (!fs.existsSync(reportPath)) {
        throw new Error(`Dashboard not found: ${reportPath}`);
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width: 1440, height: 900 }
    });

    await page.goto(`file://${reportPath}`, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'screen' });
    await page.waitForTimeout(1000);

    const tabButtons = page.locator('.tabs button, .browser-tabs button, [role="tab"], button:has-text("Setup"), button:has-text("Chrome"), button:has-text("Firefox"), button:has-text("WebKit")');
    const tabCount = await tabButtons.count();

    const mergedPdf = await PDFDocument.create();

    const expandSuitesAndCapture = async (): Promise<Buffer> => {
        // Find all test suite header bars that display .spec.ts or .setup.ts
        const suiteHeaders = page.locator('div, h3, h4').filter({
            hasText: /\.(spec|setup)\.ts/i
        });

        const count = await suiteHeaders.count();

        for (let s = 0; s < count; s++) {
            const header = suiteHeaders.nth(s);

            if (await header.isVisible().catch(() => false)) {
                // Ensure we click the topmost wrapper for that specific test suite bar
                await header.scrollIntoViewIfNeeded().catch(() => { });
                await header.click({ position: { x: 20, y: 15 } }).catch(() => { });
                await page.waitForTimeout(200);
            }
        }

        // Wait for all accordions and dynamic test lists to render completely
        await page.waitForTimeout(800);

        // Calculate dynamic height for the full page capture
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
            height: `${fullHeight + 50}px`,
            printBackground: true,
            preferCSSPageSize: false,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });
    };

    if (tabCount === 0) {
        const pdfBuffer = await expandSuitesAndCapture();
        fs.writeFileSync(finalPdfPath, pdfBuffer);
    } else {
        for (let i = 0; i < tabCount; i++) {
            const tab = tabButtons.nth(i);
            const tabName = (await tab.innerText()).trim().replace(/\s+/g, ' ');
            console.log(`Rendering tab [${i + 1}/${tabCount}]: ${tabName}...`);

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

    await browser.close();
    console.log(`Multi-page PDF generated successfully: ${finalPdfPath}`);
}

generatePdf().catch(error => {
    console.error('Failed to generate PDF:', error);
    process.exit(1);
});
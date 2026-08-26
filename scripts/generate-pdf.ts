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
        // Target top-level parent containers for each suite card/row
        const suiteCards = page.locator('.suite-item, .suite-card, .suite-row, [data-testid="suite-item"]');
        let suiteCount = await suiteCards.count();

        // Fallback: If no wrappers match the card selector, target clickable headers directly
        if (suiteCount === 0) {
            const suiteHeaders = page.locator('.suite-header, [onclick*="toggleSuite"], [onclick*="toggle"], div:has-text(".spec.ts"), div:has-text(".setup.ts")');
            const fallbackCount = await suiteHeaders.count();

            for (let s = 0; s < fallbackCount; s++) {
                const header = suiteHeaders.nth(s);
                if (await header.isVisible().catch(() => false)) {
                    await header.click().catch(() => { });
                    await page.waitForTimeout(100);
                }
            }
        } else {
            for (let s = 0; s < suiteCount; s++) {
                const suite = suiteCards.nth(s);

                if (!(await suite.isVisible().catch(() => false))) continue;

                // Locate the clickable toggle and the expandable content inside THIS specific suite
                const trigger = suite.locator('.suite-header, [onclick*="toggle"], button, svg, .chevron').first();
                const testContent = suite.locator('.suite-body, .test-list, .test-case, .test-item, .suite-tests, ul, ol').first();

                // Check if content is already visible
                const isContentVisible = await testContent.isVisible().catch(() => false);

                // Click only if the inner tests are hidden
                if (!isContentVisible && (await trigger.isVisible().catch(() => false))) {
                    await trigger.click().catch(() => { });
                    // Wait until the tests inside appear
                    await testContent.waitFor({ state: 'visible', timeout: 1200 }).catch(() => { });
                    await page.waitForTimeout(50);
                }
            }
        }

        // Wait briefly for expand transitions and animations to complete
        await page.waitForTimeout(600);

        // Calculate dynamic height of the fully expanded content
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
            height: `${fullHeight + 40}px`,
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
import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  
  // Press F8 to open Radio Wheel Overlay
  await page.keyboard.press('F8');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'extracted_frames/browser_radio_wheel.png' });
  console.log('Saved browser_radio_wheel.png');
  
  // Press F10 to open Settings Dialog
  await page.keyboard.press('F10');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'extracted_frames/browser_settings.png' });
  console.log('Saved browser_settings.png');

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

import { chromium } from '@playwright/test';

async function testCheckout() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('response', async res => {
    if (res.url().includes('paddle.com')) {
      console.log('PADDLE RES:', res.status(), res.url().slice(0, 120));
      if (!res.ok()) {
        try {
          const body = await res.text();
          console.log('ERROR RESPONSE BODY:', body.slice(0, 400));
        } catch (e) {}
      }
    }
  });

  await page.goto('https://convertinghub-official.web.app/pricing');
  await page.waitForTimeout(3000);
  console.log('Page loaded, clicking button...');
  const btn = page.locator('button:has-text("Subscribe to Pro")').first();
  await btn.click();
  await page.waitForTimeout(6000);

  const iframes = page.frames();
  console.log('Frames count:', iframes.length);
  for (const f of iframes) {
    console.log('Frame url:', f.url().slice(0, 120));
  }

  await browser.close();
}

testCheckout().catch(console.error);

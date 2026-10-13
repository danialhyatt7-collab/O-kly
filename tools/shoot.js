const { chromium } = require('playwright');
const fs = require('fs');
const sites = {
  'grounded': 'https://www.grounded.design/',
  'interarc': 'https://interarcqatar.com/',
  'alhuzaifa': 'https://www.alhuzaifa.com/en/',
  'reliable': 'https://thereliableinterior.ae/',
  'mansion': 'https://mansionedition.ae/',
};
(async () => {
  fs.mkdirSync('shots', { recursive: true });
  const browser = await chromium.launch();
  for (const [name, url] of Object.entries(sites)) {
    try {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(4000);
      for (const label of ['Accept All', 'ACCEPT ALL', 'Accept', 'Got it', 'I agree', 'Allow all']) {
        const b = page.getByRole('button', { name: label, exact: false }).first();
        if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); break; }
      }
      for (const [i, y] of [0, 900, 1800, 2700, 3600].entries()) {
        await page.evaluate(v => window.scrollTo(0, v), y);
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `shots/${name}-${i}.jpg`, type: 'jpeg', quality: 70 });
      }
      const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
      const mp = await m.newPage();
      await mp.goto(url, { waitUntil: 'load', timeout: 60000 });
      await mp.waitForTimeout(4000);
      await mp.screenshot({ path: `shots/${name}-mobile.jpg`, type: 'jpeg', quality: 70 });
      await ctx.close(); await m.close();
      console.log('ok', name);
    } catch (e) { console.log('fail', name, e.message); }
  }
  await browser.close();
})();

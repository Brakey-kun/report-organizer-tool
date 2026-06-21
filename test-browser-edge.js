import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' }).catch(e => console.log("GOTO ERROR:", e));
  
  // Wait for 2 seconds
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.$eval('#root', el => el.outerHTML).catch(e => e.toString());
  console.log("ROOT HTML:", html);
  
  await browser.close();
})();

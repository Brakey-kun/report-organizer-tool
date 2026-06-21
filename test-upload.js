import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' }).catch(e => console.log("GOTO ERROR:", e));
  
  // Create a dummy PDF
  const dummyPdfPath = path.resolve('dummy.pdf');
  fs.writeFileSync(dummyPdfPath, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');

  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile(dummyPdfPath);

  // Wait to see if it crashes
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.$eval('#root', el => el.outerHTML).catch(e => e.toString());
  console.log("ROOT HTML AFTER UPLOAD:", html.substring(0, 500) + '...');
  
  await browser.close();
  fs.unlinkSync(dummyPdfPath);
})();

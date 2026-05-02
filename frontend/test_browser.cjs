const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5174/');
  await new Promise(r => setTimeout(r, 1000));
  
  const landingBtn = await page.$('.landing-btn');
  if (landingBtn) {
    await page.click('.landing-btn');
    await new Promise(r => setTimeout(r, 1000));
    await page.click('.landing-btn');
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('Clicking continue anonymously');
  await page.click('.btn-anonymous');
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('Done waiting');
  
  await browser.close();
})();

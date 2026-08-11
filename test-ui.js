const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('request', request => {
    if (request.url().includes('/api/challans') && request.method() === 'POST') {
      console.log('--- INTERCEPTED POST /api/challans ---');
      console.log('Payload:', request.postData());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/challans') && response.method() === 'POST') {
      console.log('--- RESPONSE POST /api/challans ---');
      console.log('Status:', response.status());
      console.log('Body:', await response.text());
    }
  });

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173');
  await page.fill('input[type="email"]', 'sales@erp.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  console.log('Navigating to create challan...');
  await page.goto('http://localhost:5173/challans/new');
  await page.waitForSelector('select'); // wait for load
  await page.waitForTimeout(1000); // give it a sec to load customers and products

  console.log('Selecting customer...');
  const customerSelects = await page.$$('select');
  await customerSelects[0].selectOption({ index: 1 }); // select first real customer

  console.log('Selecting product...');
  await customerSelects[1].selectOption({ index: 1 }); // select first real product
  await page.fill('input[type="number"]', '1');
  await page.click('button:has-text("Add")');

  console.log('Saving as draft...');
  await page.click('button:has-text("Save as Draft")');

  await page.waitForTimeout(2000);
  await browser.close();
})();

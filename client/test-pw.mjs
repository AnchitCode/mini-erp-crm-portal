import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to login
  await page.goto('http://localhost:5173/login');
  
  // Fill login
  await page.fill('input[type="email"]', 'admin@erp.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for network idle
  await page.waitForLoadState('networkidle');
  
  // Go to challans
  await page.goto('http://localhost:5173/challans');
  await page.waitForLoadState('networkidle');
  
  // Wait for the table to load
  await page.waitForSelector('tbody tr');
  
  // Find a draft challan
  const rows = await page.$$('tbody tr');
  let draftId = null;
  for (const row of rows) {
    const text = await row.innerText();
    if (text.includes('Draft')) {
      await row.click();
      await page.waitForLoadState('networkidle');
      break;
    }
  }
  
  // Wait for the confirm button
  await page.waitForSelector('text="✓ Confirm Challan"');
  
  // Setup dialog handler
  page.on('dialog', async dialog => {
    console.log('Dialog message:', dialog.message());
    await dialog.accept();
  });
  
  // Click confirm
  await page.click('text="✓ Confirm Challan"');
  
  // Wait for processing
  await page.waitForTimeout(2000); // Wait 2s to see what happens
  
  const status = await page.innerText('.badge');
  console.log('Final Status Badge:', status);
  
  const errorBanner = await page.$('.alert');
  if (errorBanner) {
      console.log('Error banner:', await errorBanner.innerText());
  } else {
      const allText = await page.innerText('body');
      if (allText.includes('Failed') || allText.includes('Insufficient')) {
          console.log('Found error text on page');
      }
  }
  
  await browser.close();
})();

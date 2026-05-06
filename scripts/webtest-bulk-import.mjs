import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'https://3000-ifje2eutiwiz033i0279a-c8c3243c.us2.manus.computer';
const QUOTES_FILE = '/home/ubuntu/upload/Quotes-All_with_notes_with_metadata.json';
const LEXICON_FILE = '/home/ubuntu/upload/Clavis_Aurea_Complete.json';

async function capture(page, name) {
  await page.screenshot({ path: `/tmp/${name}.png`, fullPage: true });
}

async function maybeLoginState(page) {
  const bodyText = await page.locator('body').innerText().catch(() => '');
  return {
    bodyText,
    needsAuth: /sign in|log in|login|oauth/i.test(bodyText),
  };
}

async function testDataset(page, buttonLabel, expectedText) {
  const button = page.getByRole('button', { name: new RegExp(buttonLabel, 'i') }).first();
  await button.waitFor({ timeout: 15000 });
  await button.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const bodyText = await page.locator('body').innerText();
  return {
    foundExpected: bodyText.includes(expectedText),
    bodyText,
  };
}

const results = {
  baseUrl: BASE_URL,
  auth: null,
  quotes: null,
  lexicon: null,
  errors: [],
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(`${BASE_URL}/bulk-import`, { waitUntil: 'networkidle', timeout: 30000 });
  await capture(page, 'bulk-import-initial');
  results.auth = await maybeLoginState(page);

  if (results.auth.needsAuth) {
    results.errors.push('Authentication required in Playwright session; live UI automation cannot continue without a logged-in browser state.');
  } else {
    results.quotes = await testDataset(page, 'Load Quotes', 'Quotes');
    await capture(page, 'bulk-import-quotes');
    await page.reload({ waitUntil: 'networkidle' });
    results.lexicon = await testDataset(page, 'Load Clavis', 'Clavis');
    await capture(page, 'bulk-import-lexicon');
  }
} catch (error) {
  results.errors.push(String(error?.stack || error));
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

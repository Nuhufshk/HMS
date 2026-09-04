/* Role-based access + mobile drawer checks. Each role gets a fresh context. */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const errors = [];

const check = async (email, pass, expectNav, expectBlocked) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`${email}: ${e.message}`));

  await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.fill('#login-email', email);
  await page.fill('#login-password', pass);
  await page.click('button[type=submit]');
  try {
    await page.waitForSelector('text=Total Patients', { timeout: 20000 });
  } catch (e) {
    const url = page.url();
    const body = await page.evaluate(() => document.body.innerText.slice(0, 160));
    const emailVal = await page.inputValue('#login-email').catch(() => 'n/a');
    const passVal = await page.inputValue('#login-password').catch(() => 'n/a');
    console.log(`  DIAG ${email}: url=${url} emailField=${JSON.stringify(emailVal)} passField=${JSON.stringify(passVal)} body=${JSON.stringify(body)}`);
    throw e;
  }
  console.log(`  ${email} dashboard OK`);

  // Mobile drawer nav
  await page.click('button[aria-label="Open navigation menu"]');
  await page.waitForSelector('div[class*="z-[120]"] aside', { timeout: 5000 });
  let ok = true;
  for (const [label, present] of Object.entries(expectNav)) {
    const count = await page.locator(`div[class*="z-[120]"] a:has-text("${label}")`).count();
    if ((count > 0) !== present) {
      ok = false;
      console.log(`  ${email}: nav "${label}" expected ${present} got ${count > 0}`);
    }
  }
  console.log(`  ${email} drawer nav ${ok ? 'PASS' : 'FAIL'}`);

  // Blocked routes
  for (const url of expectBlocked) {
    await page.goto(`http://localhost:5173${url}`, { waitUntil: 'load' });
    await page.waitForSelector('text=Access restricted', { timeout: 10000 });
    console.log(`  ${email} blocked at ${url} OK`);
  }
  await context.close();
  return ok;
};

console.log('[mobile 390px + RBAC]');
let allOk = true;
allOk &= await check('doctor@adommedicalcentre.gh', 'doctor123',
  { Patients: true, Appointments: true, 'Medical Records': true, Prescriptions: true, Laboratory: true, Reports: true, Billing: false, Pharmacy: false, Doctors: false },
  ['/billing', '/pharmacy', '/staff', '/doctors']);
allOk &= await check('pharmacy@adommedicalcentre.gh', 'pharmacy123',
  { Pharmacy: true, Prescriptions: true, Patients: true, Billing: false, Laboratory: false },
  ['/billing', '/laboratory', '/appointments']);
allOk &= await check('lab@adommedicalcentre.gh', 'lab123',
  { Laboratory: true, Patients: true, Pharmacy: false, Appointments: false, Prescriptions: false },
  ['/pharmacy', '/appointments', '/prescriptions']);
allOk &= await check('reception@adommedicalcentre.gh', 'reception123',
  { Billing: true, Appointments: true, Patients: true, Laboratory: false, Pharmacy: false },
  ['/laboratory', '/pharmacy', '/reports']);
allOk &= await check('accountant@adommedicalcentre.gh', 'accountant123',
  { Billing: true, Reports: true, Patients: false, Appointments: false },
  ['/patients', '/appointments', '/pharmacy']);

await browser.close();
console.log(allOk && errors.length === 0 ? '\nALL ROLE/MOBILE CHECKS PASSED' : `\nISSUES: ${JSON.stringify(errors)}`);
process.exit(allOk && errors.length === 0 ? 0 : 1);

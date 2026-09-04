/* Smoke test: login flow, dashboard render, navigation across roles, key interactions. */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const errors = [];
let stepCount = 0;

function step(name) {
  stepCount++;
  console.log(`\n[${stepCount}] ${name}`);
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
  page.on('console', (msg) => {
    // The intentional failed-login attempt (step 2) produces a 401 resource error —
    // any other 401/console error is a real failure.
    if (msg.type() === 'error') {
      if (stepCount === 2 && msg.text().includes('401')) return;
      errors.push(`CONSOLE: ${msg.text()}`);
    }
  });

  // 1. Login page loads
  step('Login page loads');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Sign in to your account');
  console.log('  login page visible OK');

  // 2. Failed login shows error
  step('Failed login shows validation error');
  await page.fill('#login-email', 'admin@adommedicalcentre.gh');
  await page.fill('#login-password', 'wrongpass');
  await page.click('button[type=submit]');
  await page.waitForSelector('text=Invalid email or password');
  console.log('  error message shown OK');

  // 3. Successful login as admin
  step('Login as administrator');
  await page.fill('#login-password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForSelector('text=Total Patients', { timeout: 15000 });
  console.log('  dashboard rendered OK');

  // 4. Dashboard sections
  step('Dashboard sections');
  await page.waitForSelector('text=Appointment overview');
  await page.waitForSelector('text=Patient statistics');
  await page.waitForSelector('text=Recent activity');
  console.log('  dashboard sections OK');

  // 5. Patients page
  step('Patients list');
  await page.click('a[href="/patients"]');
  await page.waitForURL('**/patients');
  await page.waitForSelector('input[placeholder^="Search by name"]', { timeout: 10000 });
  await page.waitForSelector('tbody tr', { timeout: 10000 });
  const rowCount = await page.locator('tbody tr').count();
  console.log(`  patients table rendered (${rowCount} rows on page 1)`);

  // 6. Search filter works
  step('Patient search filter');
  await page.fill('input[placeholder^="Search by name"]', 'Gyamfi');
  await page.waitForTimeout(700);
  const filteredRows = await page.locator('tbody tr').count();
  console.log(`  filtered rows: ${filteredRows} (expect 1)`);
  if (filteredRows !== 1) errors.push(`Expected 1 row for 'Gyamfi', got ${filteredRows}`);
  await page.fill('input[placeholder^="Search by name"]', '');

  // 7. Open patient profile via row (sort by patient ID ascending → PT-1001 first)
  step('Patient profile');
  await page.click('button:has-text("Patient ID")');
  await page.waitForSelector('tbody tr:has-text("PT-1001")', { timeout: 10000 });
  await page.click('tbody tr:has-text("PT-1001")');
  await page.waitForURL('**/patients/PT-1001', { timeout: 10000 });
  await page.waitForSelector('text=Allergy alert', { timeout: 10000 });
  await page.click('button:has-text("Appointments")');
  await page.waitForTimeout(700);
  console.log('  profile + tabs OK');

  // 8. Appointments page + calendar
  step('Appointments calendar');
  await page.click('a[href="/appointments"]');
  await page.waitForURL('**/appointments');
  await page.waitForSelector('tbody tr', { timeout: 10000 });
  await page.click('button:has-text("Calendar")');
  await page.waitForSelector('text=Mon', { timeout: 5000 });
  console.log('  calendar OK');

  // 9. Billing — open an invoice with an outstanding balance, record a payment
  step('Billing invoice flow');
  await page.click('a[href="/billing"]');
  await page.waitForURL('**/billing');
  await page.waitForSelector('tbody tr:has(button:has-text("Record payment"))', { timeout: 10000 });
  await page.click('tbody tr:has(button:has-text("Record payment"))');
  await page.waitForSelector('text=Balance due', { timeout: 5000 });
  console.log('  invoice modal OK');
  await page.click('[role=dialog] button:has-text("Record payment")');
  await page.waitForSelector('text=Payment method', { timeout: 5000 });
  await page.click('button[type=submit][form=payment-form]');
  await page.waitForSelector('text=Payment recorded', { timeout: 8000 });
  console.log('  payment recorded OK');

  // 10. Pharmacy — stock alerts + medicine detail
  step('Pharmacy inventory');
  await page.click('a[href="/pharmacy"]');
  await page.waitForURL('**/pharmacy/medicines');
  await page.waitForSelector('tbody tr:has-text("MED-7001")', { timeout: 10000 });
  await page.click('tbody tr:has-text("MED-7001")');
  await page.waitForSelector('text=Stock movement', { timeout: 5000 });
  await page.keyboard.press('Escape');
  console.log('  pharmacy OK');

  // 11. Pharmacy prescriptions: dispense flow
  step('Pharmacy dispensing');
  await page.click('a[href="/pharmacy/prescriptions"]');
  await page.waitForURL('**/pharmacy/prescriptions');
  await page.waitForSelector('button:has-text("Dispense")', { timeout: 10000 });
  await page.click('button:has-text("Dispense")');
  await page.waitForSelector('button:has-text("Yes, dispense")', { timeout: 5000 });
  await page.click('button:has-text("Yes, dispense")');
  await page.waitForSelector('text=was dispensed', { timeout: 8000 });
  console.log('  dispensing OK');

  // 12. Laboratory workflow: collect -> process -> enter result
  step('Laboratory workflow');
  await page.click('a[href="/laboratory"]');
  await page.waitForURL('**/laboratory');
  await page.waitForSelector('tbody button:has-text("Collect")', { timeout: 10000 });
  await page.click('tbody button:has-text("Collect")');
  await page.waitForSelector('[role=status]:has-text("sample collected")', { timeout: 6000 });
  await page.waitForSelector('tbody button:has-text("Process")', { timeout: 6000 });
  await page.click('tbody button:has-text("Process")');
  await page.waitForSelector('[role=status]:has-text("processing started")', { timeout: 6000 });
  await page.waitForSelector('tbody button:has-text("Enter result")', { timeout: 6000 });
  await page.click('tbody button:has-text("Enter result")');
  await page.waitForSelector('text=Enter laboratory result', { timeout: 5000 });
  await page.fill('input[placeholder="Result value"]', '12.5');
  await page.click('[role=dialog] button:has-text("Save result")');
  await page.waitForSelector('[role=status]:has-text("is now completed")', { timeout: 8000 });
  console.log('  lab workflow OK');

  // 13. Medical records page
  step('Medical records timeline');
  await page.click('a[href="/medical-records"]');
  await page.waitForURL('**/medical-records');
  await page.waitForSelector('text=Chronological clinical timeline', { timeout: 10000 });
  await page.waitForSelector('text=Add record', { timeout: 8000 });
  console.log('  medical records OK');

  // 14. Reports page + period filter
  step('Reports');
  await page.click('a[href="/reports"]');
  await page.waitForURL('**/reports');
  await page.waitForSelector('text=Operational performance', { timeout: 10000 });
  await page.waitForSelector('text=Department performance', { timeout: 8000 });
  await page.click('button:has-text("This year")');
  await page.waitForTimeout(700);
  console.log('  reports OK');

  // 15. Theme switching
  step('Theme switching (dark)');
  await page.click('button[aria-label="Change colour theme"]');
  await page.click('text=Dark');
  await page.waitForTimeout(400);
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log(`  dark class applied: ${isDark}`);
  await page.click('button[aria-label="Change colour theme"]');
  await page.click('text=Light');
  await page.waitForTimeout(400);
  const isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
  console.log(`  back to light: ${isLight}`);

  // 16. Refresh persists session
  step('Session persists on refresh');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('text=Operational performance', { timeout: 15000 });
  console.log('  session persisted OK');

  // 17. RBAC: nurse blocked from Billing
  step('RBAC: nurse blocked from Billing');
  await page.click('button[aria-label="User menu"]');
  await page.click('text=Log out');
  await page.waitForURL('**/login');
  await page.fill('#login-email', 'nurse@adommedicalcentre.gh');
  await page.fill('#login-password', 'nurse123');
  await page.click('button[type=submit]');
  // Login returns the user to the page they originally tried to reach (/reports),
  // where the role guard blocks them with an unauthorized state.
  await page.waitForSelector('text=Access restricted', { timeout: 15000 });
  const billingNav = await page.locator('a[href="/billing"]').count();
  console.log(`  billing nav visible to nurse: ${billingNav} (expect 0)`);
  if (billingNav !== 0) errors.push('Nurse can see Billing nav');
  await page.goto(`${BASE}/billing`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Access restricted', { timeout: 10000 });
  console.log('  unauthorized state shown OK');

  await browser.close();

  console.log('\n==================== RESULT ====================');
  if (errors.length) {
    console.log(`FAILED — ${errors.length} issue(s):`);
    errors.slice(0, 20).forEach((e) => console.log('  ' + e));
    process.exit(1);
  }
  console.log('ALL SMOKE TESTS PASSED — no console/page errors.');
  process.exit(0);
}

run().catch((err) => {
  console.error('SMOKE TEST CRASHED:', err.message);
  process.exit(1);
});

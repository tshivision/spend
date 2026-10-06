// Regression test: does the CSV reader understand different banks' exports?
// Run from a folder where `npm i playwright chart.js papaparse` has been done:
//   node tests/banks.test.js
// Expected counts = number of SPENDING rows (payments, refunds, income are ignored).
// Samples are synthetic. Never commit real statements to this repo.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const EXPECT = {
  'amex.csv': 2, 'cba_au.csv': 3, 'chase.csv': 2, 'dircol.csv': 2, 'euro.csv': 2, 'junk.csv': 0,
  'monzo.csv': 2, 'preamble.csv': 1, 'rbc.csv': 2, 'revolut.csv': 1, 'td_headerless.csv': 3,
  'ws_invest.csv': 0, 'wealthsimple_style.csv': 3, // two identical same-day coffees must BOTH be kept
};
(async () => {
  const root = path.resolve(__dirname, '..');
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const p = await b.newPage(); let fail = 0;
  const nm = process.env.NODE_MODULES || path.join(process.cwd(), 'node_modules');
  await p.route('**/Chart.js/**', r => r.fulfill({ path: nm + '/chart.js/dist/chart.umd.js', contentType: 'application/javascript' }));
  await p.route('**/PapaParse/**', r => r.fulfill({ path: nm + '/papaparse/papaparse.min.js', contentType: 'application/javascript' }));
  p.on('pageerror', e => { console.log('PAGE ERROR', e.message); fail++; });
  await p.goto('file://' + path.join(root, 'spending-dashboard.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { window.openMapper = () => Promise.resolve(null); }); // no pop-ups in tests
  for (const [f, want] of Object.entries(EXPECT)) {
    const text = fs.readFileSync(path.join(__dirname, 'banks', f), 'utf8');
    const got = await p.evaluate(async ([n, t]) => (await parseCSV(new File([t], n))).length, [f, text]);
    const ok = got === want; if (!ok) fail++;
    console.log((ok ? 'PASS ' : 'FAIL ') + f + ' -> ' + got + (ok ? '' : ' (expected ' + want + ')'));
  }
  await b.close(); console.log(fail ? fail + ' problem(s)' : 'all good'); process.exit(fail ? 1 : 0);
})();

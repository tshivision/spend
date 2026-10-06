# spend. — project guide

Single-file, client-side personal spending dashboard. Users drop in bank/credit-card CSVs and get charts, locations, subscriptions and a shareable card. **Everything runs in the browser. No backend, no accounts, no uploads.**

Live: Vercel (`spend-dashboard-gilt.vercel.app`, auto-deploys from `main`). Also mirrored on GitHub Pages (no analytics there).

## Files
- `spending-dashboard.html` — the whole app (HTML + CSS + JS, ~110KB). Chart.js and PapaParse load from CDN.
- `how-to-use.html` — tutorial for exporting bank CSVs.
- `vercel.json` — rewrites `/` to `spending-dashboard.html` (repo has no `index.html`).
- Don't add a build step or framework unless asked. "One file you can remix" is a feature.

## Data pipeline (keep this order)
`parseCSV` → `normM()` (clean merchant name) → `catTX()` (calls `dbLookup()` on `MERCHANT_DB` first, then keyword rules) → `detectLoc()` (`LOC_RULES`, then `CITY_DATA`) → `dedup()` → `build()` renders.
Row shape: `{date, merchant, rawMerchant, amount, category, subcategory, location}`.
CSV format assumed: `MM/DD/YYYY, merchant, debit, credit`. Only positive net amounts (spend) are kept.

## Merchant database rules
- `MERCHANT_DB` is compact: `{'Category|Sub': 'KEY~KEY~…'}`, decoded at load into `{KEY:[cat,sub]}`.
- Keys are UPPERCASE fragments matched with `.includes()` against the normalized name. **Longest key wins.** A trailing space in a key means "match at end of word/string".
- **Avoid short or generic keys** (they cause false positives: `ANA ` matched BANANA, `AVIS` matched DAVIS). Prefer 5+ characters or distinctive tokens. Test new keys against nonsense words.
- `cleanRaw()` strips payment prefixes (SQ*, TST*, PY*, DD*, …) and store-number suffixes before matching.
- Ordering traps already handled in `normM`: Uber Eats before Uber; Amazon Web Services / Prime / AMZN before generic Amazon.
- Locations: Tian's own rules (Bali, Seoul, Japan, Shanghai, KL, Singapore, Bangkok…) come first and win. `CITY_DATA` (AU + US cities) is appended after. Ambiguous city names need a state suffix (AUSTIN TX, BOSTON MA).

## Persistence (on the user's device only)
- IndexedDB db `spend-dashboard`, store `kv`: key `tx` = raw rows `{d, m, a}` (date, raw merchant, amount); key `overrides` = `{merchantName: category}`.
- Only raw fields are saved; categories are recomputed on load so DB improvements apply to old data. User overrides are applied on top (`OVERRIDES` in `buildTX` / `applyOverrides`).
- Sample data is never saved. "Your data" menu: download copy / load copy / delete.
- **Privacy promise in the UI**: nothing leaves the device. Do not add network calls that send transaction data. If a backend is ever added, the copy on the upload screen and the feature list must change first.

## Share card
`drawShare()` paints a 1080×1350 canvas. Amounts and merchant names are hidden by default (checkbox to show). No external libraries.

## Testing (no framework; use Playwright)
Run headless Chromium (`/opt/pw-browsers/chromium`). In the sandbox, CDNs are blocked: route `**/Chart.js/**` and `**/PapaParse/**` to local npm copies (`npm i chart.js papaparse` in a scratch dir, not the repo).
Before pushing a merchant change, check at least: categorization of a few known merchants, plus false-positive probes (BANANA, DAVIS PARK, BANKER, CONSULTANT). Before pushing a UI change: upload a CSV → dashboard renders → reload → data still there → share card draws → no `pageerror`.

## Deploy
`git push origin main` → Vercel builds from Git automatically. Verify with the Vercel deployments list that the newest deployment has the pushed commit SHA and is READY. Analytics tag (`/_vercel/insights/script.js`) lives in `<head>`; keep it.

## Style
Fonts: Fraunces (headings), DM Mono (UI). Palette tokens are in `:root` (`--accent:#C4421A`). Keep the warm paper look; category colors live in `CAT_COLORS`.

## Working with Tian
Casual, concise. Give honest pushback. End with one small concrete next action. Don't paste secrets (GitHub tokens etc.) into chat; use the connected GitHub/Vercel tools.

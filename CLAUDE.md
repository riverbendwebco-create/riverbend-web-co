# Instructions for Claude

This repo is the Riverbend Web Co. website (riverbendwebco.com), a single static `index.html` deployed by Render from the `main` branch.

Before making any change, read and follow **WEBSITE_BUILD_RULES.md** in this repo. It covers the design rules, pricing, security checklist, hosting setup and QA steps.

Key reminders:
- Pull `main` before editing; push to `main` to deploy (Render redeploys in about a minute).
- Screenshot desktop and phone before every push.
- No em dashes, no emoji in the interface, no pill shapes, no beige.
- When pricing or terms change, update every place they appear, including the service agreement and the chat assistant.

## Backend (Google Apps Script)
- The live Apps Script project only holds a small loader (`apps-script/Code.gs`). The real backend is `apps-script/backend.js`, served from riverbendwebco.com and cached by the loader for 5 minutes.
- To change forms, emails, the Demo Studio or the Website Assistant: edit `apps-script/backend.js`, keep the `RIVERBEND_BACKEND` marker in its first line, and push. It goes live within 5 minutes. The user never needs to paste or redeploy.
- Only touch `apps-script/Code.gs` if a NEW Google service is needed (add it to `scopes_()`); that one change does require the user to paste and Allow once.

## Demo pages (/demo)
- `demo/index.html` is GENERATED. Edit `tools/demo_template.js` (layout and data) and run `python3 tools/build_demo.py`; it pulls the demo CSS and icons straight from `index.html` so prospect demos always match the Lock & Dam Tap, Ember & Oak and Bluff City Pro designs.
- Never invent facts on a prospect demo (no review counts, years in business, licenses, taps). Leave a section out if there is no real data for it.

## Owen's pull requests (auto-merge)
- `.github/workflows/auto-merge-demos.yml` auto-approves and merges PRs from `oseffrood9681-web` when every changed file is under `demo/`, `tools/demo_template.js` or `tools/build_demo.py`. Draft PRs are skipped.
- PRs that touch anything else (index.html, studio/, apps-script/, .github/) still need Kruz's approval. Keep it that way: backend.js runs as Kruz's Google account.
- Demo data updates go in `demo/data/seeds.json` (fetched by backend.js, cached 5 min, each key runs once). New per-demo fields go under `x`. See DESIGN_TEAM.md. Do not put seed data back into backend.js.

## riverbendwebcoleads (/leads)
- Chat-only lead finder at riverbendwebco.com/leads. Same login as the Studio. Page: `leads/index.html`; backend: the `leads_*` actions at the bottom of `apps-script/backend.js`.
- Default data is FREE (the owner does not want to pay): OpenStreetMap via public Overpass servers (cached 24 h) plus a DuckDuckGo search to find websites the map is missing (cached 7 days). Do not add paid services or ask for a card.
- Optional: if Script Property PLACES_KEY is ever set, Google Places is used instead (cached 6 h, capped at 300 calls a day).
- Saved leads live in the "Prospects" tab of the Riverbend Leads sheet. "Build demo" creates a Studio demo from the lead's Google info (and scans their site if they have a real one).
- Lead labels must stay honest: "No website on Google", "Only a Facebook page", weak-site reasons from an actual fetch. Never claim a business has no website without that check.

## Daily lead finder
- `.github/workflows/daily-leads.yml` runs `tools/daily_leads.py` every morning (5:10 AM CST / 6:10 AM CDT) and on demand (Actions > Daily leads > Run workflow).
- It finds up to 50 new leads within about 30 miles of Dubuque (`leads_find` with `wide:true`), checks their websites, and saves them to the Prospects sheet with the note "Daily finder <date>". No-website and Facebook-only first, then weak sites. Only independent businesses with a phone number; skips any id, name or phone already saved.
- No password or secret: the job logs in with GitHub's signed OIDC token (`bot_login` in backend.js), which only works for this workflow file on main and only allows leads_find, leads_verify, leads_saved and leads_save.
- Each run prints a `SUMMARY:` line and uploads `daily-leads-summary.txt`; a Claude scheduled task reads it and sends Kruz a phone summary.

## Billing (Square): /billing and /pay
- Owner dashboard: riverbendwebco.com/billing (Studio password). Client page: riverbendwebco.com/pay/#<key> (private link per client). Backend: the `BILLING` section at the bottom of `apps-script/backend.js`; daily job `.github/workflows/daily-billing.yml` + `tools/daily_billing.py` (OIDC bot that may only run `billing_tick`).
- Flow: agreement signed -> billing account (Billing tab of the Riverbend Leads sheet) -> client saves a card with Square's Web Payments SDK (setup fee charged then for Pay Upfront) -> owner clicks "Website Live - Activate Billing" -> prorated launch charge -> full charges on the 1st.
- Monthly charges use Square Subscriptions (accounts with engine 'sub', all new signups): at "Website Live" we charge the exact prorated launch amount with the Payments API and create a Square subscription (plan "Riverbend Website Service", one variation per package/option, MONTHLY STATIC, billing day 1, can_prorate false) starting the next 1st (or today if launch is on the 1st). Square charges the card on the 1st, emails receipts and, on a decline, emails the client an invoice. billSubSync_ (daily job + Square webhooks as a nudge) mirrors the subscription's invoices as charges, which drives the 12-payment count, ownership, the agreement's reminder schedule and the dashboard. We never charge a failed subscription invoice directly (Square's API cannot mark an invoice paid, so that would double charge); a card update goes onto the subscription and the client pays the open invoice on Square's link. Cancellation: the subscription is canceled before the final month, which we charge prorated ourselves. Older accounts without engine 'sub' keep the Riverbend charge schedule. Setup fees and card storage: Payments + Cards APIs. Never store card numbers; keep only Square IDs.
- Prices live in BILL_TIERS (cents). If prices change, update BILL_TIERS, TIERS in index.html, the agreement, the chat KB and WEBSITE_BUILD_RULES.md.
- Test mode (Square sandbox) is the default; customer emails in test mode go only to riverbendwebco@gmail.com and clients are not shown the pay link. Going live requires the owner to type GO LIVE in /billing settings. Access tokens are entered by the owner in /billing settings (Script Properties), never in the repo.
- Cancellation refunds: if a payment already collected covers days after a cancellation's effective date (late-recorded notice), billRefundCheck_ proposes the exact refund per payment, emails both owners and shows it in /billing. billing_refund (owner account only, typed REFUND) issues it through Square with a fixed idempotency key; one proposal per payment. Never refund automatically.
- Never automatically charge a remaining $0-down balance, take a site offline, or touch a domain. Suspension and ending billing need an owner click.
- Tests: `node tools/billing_tests/tests.js` (100 checks), `cancel_retry_test.js` (cancellation, launch/final retries and cancellation refunds, 34) and `node tools/billing_tests/catalog_test.js` (Square item library). Run them before every billing change.
- Square item library (for in-person sales in the Square app): /billing > Square settings > "Update Square items" (billing_catalog, live account, preview first). Old plans are hidden, never deleted. A setup fee taken in person is recorded with "Setup fee paid in person" so the pay link only saves the card.
- In-person sales in the Square app: the salesman charges the plan item, adds the customer with the SAME email (or phone) as the signed agreement, and taps Save Card. `billFindSquareCard_` (daily job + "Find card saved in Square app" button) finds that card for monthly billing and marks the setup fee paid. Live mode only. Tests: `node tools/billing_tests/squareapp_test.js`.
- "Charge in Square app" on /pay (phones/tablets, live mode): opens the Square app through the Point of Sale API with the amount, note and Square customer filled in; Square returns to /pay/done/ (registered as the Web callback URL in the Square Developer Console > Point of Sale API), which calls pay_pos_done to pick up the payment and the saved card. "$1 Square app test link" in /billing settings makes a live test account with a $1 setup fee that is never launched or billed.
- Billing has its OWN owner-only login (billing_login; password emailed to riverbendwebco@gmail.com by "Email me a new password", only a salted hash in Script Properties; 2-hour sessions; Studio sessions cannot open billing). Every billing change and login is written to the "Billing Activity" sheet (never passwords or keys). "Check Square subscriptions" (billing_verify, also daily) confirms price, saved card, billing day 1 and one payment per month.
- Business identity: Riverbend Web Co. is a DBA of Outlaw Nightfall LLC (Iowa). In legal agreements identify the party as "Outlaw Nightfall LLC, an Iowa limited liability company, doing business as Riverbend Web Co."; keep Riverbend Web Co. as the public brand. Never rename the LLC or imply a separate Riverbend LLC.
- Legal terms: Version 2.1 (Nov 23, 2026) = Version 2.0 plus LLC/DBA identification only. Client Service Agreement and Recurring Payment Authorization, Version 2.0, approved by Riverbend's legal team (confirmed by Kruz Nov 23, 2026) and published Nov 23, 2026. The website agreement, agreement.html, pricing, FAQ, chat KB, payConsent_ and customer emails must stay word-for-word consistent; any wording change needs owner approval and a new version number. Signatures record 'Agreement Version'; card authorizations record BILL_CONSENT_V.
- Signed agreements: agreementPdf_ fills apps-script/agreement.html (the agreement text) and emails the PDF to the client (agreementToClient_) and to Riverbend, and saves it to Drive > Signed Agreements. Keep agreement.html in sync with the agreement modal.
- Deploy check: GET <web app>?action=version returns BILL_VERSION; bump it with backend changes and poll it instead of waiting a fixed time.

## Accounts and roles (/login, /sales)
- One login for Studio, Leads, Sales and Billing: riverbendwebco.com/login. Helper: login/auth.js (token in localStorage when "Keep me signed in", else sessionStorage, key rbAuth). Backend: the ACCOUNTS section of apps-script/backend.js (auth_* public actions, team_* owner actions, sales_customers).
- Roles: owner (everything) and sales (Studio, Leads with own or unassigned leads, sign-ups, own customers and commission). Enforced in studio_ (AUTH_SALES_OK whitelist); billing_* and team_* are owners only. Customers are credited to the rep from the signed-in session sent with the agreement, never from a form field.
- Passwords: PBKDF2-SHA256 600,000 rounds in the browser with a per-user salt, then SHA-256 with a per-user server salt; only hashes stored (Script Properties AUTH_USERS). Owners need TOTP (authenticator) plus 8 hashed recovery codes. Sessions: random 256-bit tokens stored hashed (AUTH_S_*), 12 h or 30 days trusted; password reset, role change or disable ends them. Setup links 72 h, reset links 1 h, single use, hashed.
- First accounts: AUTH_SEED holds SHA-256 of approved emails with name and role; auth_bootstrap({emails}) sends their setup links once. Add more people from /sales (owners).
- The old shared Studio password and billing password keep working until an owner clicks "Turn off the shared Studio and billing passwords" on /sales (needs both owners set up). After that login_ and billing_login return disabled.
- Tests: node tools/billing_tests/auth_test.js (accounts, roles, direct-endpoint checks for Owen).

# Riverbend Web Co. Passdown

Last updated: November 23, 2026. Read this with `CLAUDE.md` (technical rules) and `WEBSITE_BUILD_RULES.md` (design, pricing, QA).

## The business

- **Riverbend Web Co.** is a DBA of **Outlaw Nightfall LLC** (Iowa). Owners: Kruz Kitelinger and Rayald Ally. Sales partner: Owen Seffrood.
- Website: riverbendwebco.com (static `index.html` on Render, deploys from `main` in about a minute).
- Backend: Google Apps Script loader (`apps-script/Code.gs`) pulls `apps-script/backend.js` from the site, cached 5 minutes. Check deploys with `GET <web app>?action=version` (returns `BILL_VERSION`).
- Goal right now: reach about $5k in a month through outreach. Upfront plans (Custom $999, Premium $2,499) are the fastest path; $0-down plans build monthly income slowly.

## Legal and billing (live)

- **Agreements:** Client Service Agreement and Recurring Payment Authorization, **Version 2.1**, published Nov 23, 2026 (Version 2.0 approved by the legal team, plus LLC/DBA identification). The website agreement, `apps-script/agreement.html`, pricing, FAQ, chat KB, `payConsent_` and customer emails must stay word-for-word consistent. Any wording change needs owner approval and a new version number.
- **Square:** live payments are ON and must stay on. Square Subscriptions for monthly billing, billing day 1. Owner billing dashboard at /billing, client pay links at /pay/#key.
- **Cancellation refunds:** detected automatically, proposed to both owners, issued only when an owner types REFUND. Never automatic.
- **Hard rules:** never charge a card without owner approval, never repeat the $1 test, never enter card numbers or passwords, never change Square ownership, taxpayer, banking or credentials, never create a new Square account.
- Square display name was changed by Kruz to Riverbend Web Co.; taxpayer info entered by Kruz. The Square location is still labeled "Riverbendwebco" (optional rename).

## Accounts and roles

- One login at /login for Studio, Leads, Sales, Billing, Outreach. Roles: owner and sales.
- Owen: active sales account. Commission settings: $25 / $50 / $75 bonus (Starter / Custom / Premium) when the website goes live, plus 10% of monthly payments for as long as the customer stays.
- Rayald: account active, has not signed in or set up two-step yet.
- The old shared Studio and billing passwords are still on. Do not turn them off until Rayald and Owen finish testing their accounts.

## Outreach (/outreach, owners only)

- Manual cold email from Kruz's Zoho inbox (kruz@riverbendwebco.com). The system never sends cold email itself. Daily cap 25.
- Flow: Find businesses (any US town, free OpenStreetMap data) > Add (finds an email from the listing or a site scan) > Send today list shows the draft > send from Zoho > tap Mark sent. Follow-ups on day 3 and day 8.
- **No per-business demos.** Each email links the sample that fits the business type (`outStyle_` in backend.js):

| Business type | Sample linked |
|---|---|
| Bars, taverns | /demo/?d=sample-bar (The Timber Ridge Tavern) |
| Restaurants, cafes | /demo/?d=sample-restaurant (Vela Osteria) |
| Salons, barbers, boutiques | /?preview=salon (Studio Nine) |
| Auto shops, tire, body | /demo/?d=sample-auto (Ironbridge Auto Center) |
| Real estate | /demo/?d=sample-realtor (Dana Whitaker) |
| Everything else | /demo/?d=sample-trade (Northline Painting & Drywall) |

- Email 1 subject: "Question about [Business]'s website". Signed "Owner, Riverbend Web Co." with the military cybersecurity line.
- CAN-SPAM: every email has "Business inquiry from Riverbend Web Co.", the postal address (set in Outreach > Settings, stored in Script Properties, not in this repo) and an unsubscribe link. The unsubscribe page now needs a tap on "Yes, unsubscribe me" so email link scanners can't opt people out.
- Mt. Vernon Road Tire (Cedar Rapids) shows as unsubscribed minutes after the first email, likely a Yahoo link scanner. Leave them opted out for email; a phone call is fine.
- Reality check: most small businesses with weak or no websites have no public email (2 of 28 in the last search). Phone calls and walk-ins with a demo on screen will close better. The Dubuque bar search in outreach_find hung once and should be looked at.

## Homepage samples ("Pick a Look", 6 cards)

1. Neighborhood Bar & Grill: **The Timber Ridge Tavern** (Holler Inn layout), `demo/data/sample-bar.json`
2. Restaurant & Fine Dining: **Vela Osteria** (Osteria Amici layout), `demo/data/sample-restaurant.json`
3. Local Service & Trade Pro: **Northline Painting & Drywall** (Welborn layout), `demo/data/sample-trade.json`
4. Salon, Barber & Boutique: **Studio Nine** (pop-up preview in index.html)
5. Auto Repair & Sales: **Ironbridge Auto Center** (A&B layout), `demo/data/sample-auto.json`
6. Real Estate Agent: **Dana Whitaker** (Francis Gill layout), `demo/data/sample-realtor.json`

All made-up samples: no reviews, ratings or invented credentials, 555 phone numbers, stock photos, and the "Sample website / Made-up business" bar (`x.sample: true`). The old pop-up previews (Lock & Dam Tap, Ember & Oak, Bluff City Pro) still exist behind `?preview=pub|lounge|trade` but no card links to them.

## Prospect demos worth knowing

- **Spirited** (cocktail lounge, 105 E Jefferson Blvd, Suite 100, South Bend, IN): `/demo/?d=spirited-d4d65`. Custom `spirited()` design in `tools/demo_template.js`, CSS in `tools/build_demo.py`. Cinematic luxury layout: bar photo with lights fading on, faint WebGL smoke on the hero, story, signature pours (pinned horizontal on desktop), gallery from their site, menu preview plus full tabbed menu (including Snacks, added via `demo/data/seeds.json`), reservation request form (preview only), private events and catering, visit, footer. Before pitching, confirm with them whether they take reservations or host private events; their own site only mentions catering and gift cards.
- Real demos unchanged: The Holler Inn, Osteria Amici, Welborn Painting & Drywall, Francis Gill (realtor), A&B Automotive, Mountaintop, BUZ.
- Lead pipeline (as of Nov 23): 49 saved leads (45 never contacted), 17 demos (13 ready and never pitched). Pitching those 13 is the fastest path to sales.

## Recent fixes worth remembering

- Demo seeds: `demoSeeds_` now reads the **newest 100** entries of `demo/data/seeds.json` (it used to read only the first 60, so new seeds never ran).
- Lead site checks split failing batches instead of falling back to slow one-by-one fetches.
- Login: forgot-password sends a new setup link to invited accounts; password rules shown.

## Open items

- Homepage testimonials: Kruz confirmed they are real.
- Rayald: sign in and set up two-step, then turn off the shared passwords.
- Independent sales rep agreement (draft Claude Doc): needs Kruz's decisions and attorney review before use. Do not publish without approval.
- Signed-agreement PDF signature block still says "Co-Owners" for Riverbend. Changing it is an agreement change: show Kruz first.
- First real customer card save, and the December 1 subscription charge: watch both in /billing.
- Optional: Google review link (g.page/r/CUPeNAUpUZGfEAE/review) as a "Review us on Google" button and an automatic review request 7 days after launch (not built yet).
- Optional: TikTok voiceover (ElevenLabs out of credits), Square location rename.

## Tests (run before billing, outreach or account changes)

```
node tools/billing_tests/tests.js            # 100
node tools/billing_tests/cancel_retry_test.js  # 34
node tools/billing_tests/catalog_test.js
node tools/billing_tests/squareapp_test.js
node tools/billing_tests/auth_test.js        # 53
node tools/billing_tests/outreach_test.js    # 20
```

## Working rules

- Push and deploy yourself; never hand Kruz code to paste.
- Screenshot desktop and phone before every push.
- No em dashes, emoji, pill shapes or beige on the site. Real photos, no cartoony art.
- Never invent facts on a prospect demo. Look through a prospect's real site (including image menus) before claiming something is missing.
- Check real status instead of long fixed waits.
- The repo is public: no secrets, passwords, keys or personal addresses in it.

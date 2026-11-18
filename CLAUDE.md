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

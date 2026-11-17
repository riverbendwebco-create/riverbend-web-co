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

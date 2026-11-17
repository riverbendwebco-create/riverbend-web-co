# Design team: shipping demo work

Your pull requests go live on their own (merged and deployed in about a minute)
when **every** changed file is one of these:

- `demo/...` (including `demo/data/seeds.json` and `demo/index.html`)
- `tools/demo_template.js`
- `tools/build_demo.py`

Anything else (`index.html`, `studio/`, `apps-script/`, `.github/`) waits for
Kruz to approve it. The bot leaves a comment listing which files held it up.

Work as a **draft** pull request and click **Ready for review** when done.
Drafts are never merged.

## Updating a demo in the Studio (no backend changes needed)

Add an entry to `demo/data/seeds.json`. Do not edit `apps-script/backend.js`
for demo data any more.

```json
{ "key": "mason-gallery-3", "slug": "mason-dixon-saloon-b801e", "patch": true,
  "data": { "photos": ["https://example.com/a.jpg"] } }
```

- `key`: new and unique each time (lowercase, numbers, dashes). Each key runs once.
- `slug`: the demo's slug from the Studio.
- `patch: true`: only change the fields in `data`; everything else stays.
  Leave it out to replace the whole demo.
- `dropHero: true`: remove the demo's uploaded hero image.
- Applies the next time anyone opens the Studio, within 5 minutes of going live.
- Old entries that have already run can be deleted to keep the file small.

## New fields for a design

The backend already stores the standard fields (name, items, specials, reviews,
photos, heroUrl, storyPhoto, variant, colors and so on). `variant` takes any
lowercase name, such as `warm` or `ranch-2`.

For anything new, put it under `x` and read it in the template as `C.x`:

```json
"data": { "x": { "gallery": [ { "src": "https://...", "caption": "Lower level" } ] } }
```

`x` takes text, numbers, true/false, lists and objects, up to 3 levels deep and
about 20 KB. Always render it with `h()` (text nodes), and check links with
`okUrl()` before using them in `href` or `src`.

## Rules

- Never invent facts on a demo: no made-up reviews, awards, years or licenses.
- Run `python3 tools/build_demo.py` after changing the template, and commit
  `demo/index.html`.
- No em dashes, no emoji in the interface, no pill shapes, no beige.

# Riverbend Web Co. Website Build Rules

The standard for every website Riverbend builds, including our own (riverbendwebco.com).
These rules come from building and launching riverbendwebco.com. Follow them on every new site unless the client asks for something different.

---

## 1. How we work

1. **Ask before guessing on anything visual or legal.** If a request can be read two ways (a color, a layout, a term in a contract), ask one short question with options before building.
2. **Confirm every claim before it goes live.** Only publish facts the owner has confirmed: "veteran-owned," licenses, years in business, review counts, portfolio sites. Never invent credentials.
3. **Portfolio sites must be our own work.** Before showing a site as "work we built," confirm we built it. If not, it can be inspiration only and never appears on the page.
4. **Show before you push.** Screenshot desktop (1360px) and phone (390px) for every change. Look at the screenshots before committing.
5. **Pull before you push.** Always `git fetch` and fast-forward `main` before editing, so you never overwrite someone else's change.
6. **One change, one commit, clear message.** Say what changed and why in plain English.
7. **Small, honest updates to the client.** Say what changed, what to check, and anything that could not be verified (for example, outside images that could not load in the build environment).

---

## 2. Hosting and launch checklist (GitHub + Render + Cloudflare)

- [ ] Site is a single static `index.html` at the repo root (plus any images or assets).
- [ ] Render static site settings: **Branch** `main`, **Build command** blank, **Publish directory** `.`
- [ ] Auto-deploy is on, so every push to `main` goes live in about a minute.
- [ ] Custom domain added in Render for both `domain.com` and `www.domain.com` (www redirects to the root).
- [ ] Cloudflare DNS records point to Render: `A` record for the root (use the address Render shows, for example `216.24.57.1`) and `CNAME` for `www` pointing to `servicename.onrender.com`.
- [ ] Cloudflare proxy is **off (grey cloud, DNS only)**. Ignore Cloudflare's "proxying is required" banner. Orange cloud breaks Render's certificate.
- [ ] Render shows **Verified** and **Certificate Issued** for both domains.
- [ ] After the custom domain works, **turn off the onrender.com subdomain** so Google only sees one address.
- [ ] Add a canonical tag: `<link rel="canonical" href="https://domain.com/">` and a matching `og:url`.
- [ ] Test `http://domain.com` and `http://www.domain.com`: both must redirect to `https://domain.com`.
- [ ] If the owner sees "Not Found" or "Not secure" right after launch: hard refresh (Ctrl + Shift + R) or test in a private window first. Chrome also labels `view-source:` pages "Not secure"; that is not a real problem.
- [ ] Give Claude push access: the Claude GitHub App must be installed on the account that owns the repo (github.com/apps/claude/installations/select_target), with access to that repo.

---

## 3. Forms

- **Render does not process form submissions.** Netlify Forms (`data-netlify="true"`) only work when hosted on Netlify.
- On Render, use a form service (Formspree, or a Google Apps Script that writes to a Google Sheet and emails the owner).
- **Render answers a POST to `/` with 200 OK**, so a `fetch('/')` form looks like it sent when nothing was delivered. Never treat a 200 from your own static host as proof of delivery.
- Riverbend uses **FormSubmit** (free, no account, supports file attachments up to 10 MB): the preview form posts multipart to `https://formsubmit.co/<email>` with `_next` back to `/?sent=1#contact`; the agreement copy uses `https://formsubmit.co/ajax/<email>` and checks `success` in the JSON. Add `https://formsubmit.co` to CSP `form-action` and `connect-src`.
- FormSubmit needs a one-time activation: submit the live form once, then click "Activate Form" in the email it sends. Until then nothing is delivered.
- **Never show a success message unless the submission actually went through.** On failure, show an error with the business email.
- Large fields (like a drawn signature image) can exceed a form service's size limit. Fall back to "save a PDF and email it."

---

## 4. Design rules

### Look and feel
- **Clean, Apple-style.** Generous white space, centered hero, big confident headlines.
- **Typography:** system SF Pro on Apple devices, Inter everywhere else. Headlines weight 700 with tight letter spacing (about -0.03em). Small section labels in a monospace font.
- **No em dashes anywhere.** Use commas, periods or colons instead.
- **No emoji in the interface.** Use real SVG icons for everything (stars, checks, phone, map, social logos).
- **Corners:** 10 to 12px on boxes and cards, 10px on buttons. Not super-rounded.
- **No pill shapes.** Tags, chips and labels use square-ish 6px corners or no box at all.
- **No beige.** Stick to the brand palette.
- **Avoid the generic "AI landing page" look:** colored all-caps eyebrow labels, rows of boxed icon cards, and pill chips everywhere. Prefer numbered section labels (`01 / Recent work`), thin hairline dividers, and big stat numbers.

### Riverbend brand palette
| Use | Color |
|---|---|
| Primary (cobalt) | `#0052CC` |
| Light accent | `#60A5FA` |
| Dark base | `#0F172A` |
| Dark secondary | `#1E293B` |
| Near-black bands | `#050507` |
| Soft section background | `#F8FAFC` |

### Page rhythm
- Alternate section backgrounds so scrolling has rhythm: **white, soft gray `#F8FAFC`, and an occasional dark band.**
- Do not make too many sections dark. If something "looks too dark," switch it to white or soft gray first.

### Header and hero
- Dark glass sticky header that blends into the hero (no harsh white bar at the top).
- Hero backdrop: a real photo with a navy overlay (darker on the text side), not a flat color.
- Credentials (for example "Veteran-Owned | Built by cybersecurity experts") sit above the hero quote as **one clean line**: bold white uppercase, wide letter spacing, blue icons, thin divider. No boxes. Stack the two parts on phones.
- A quote callout uses real curly quotes and an attribution line, not a pill box.

### Logo
- Convert the logo to a **true SVG** (trace the PNG into vector paths) and store light and dark versions as `<symbol>`s. Use it in the header, footer, favicon and chat assistant.

### Images
- Use real photography (Unsplash) for food, drinks, interiors and trades.
- Every photo area has a **CSS gradient fallback** so the layout still looks right if an image fails to load.
- Portfolio screenshots can come from a live screenshot service, but real screenshot files committed to the repo load faster and look sharper. Prefer files once available.
- **Never use Apple product photos** or other brand imagery. Build device frames (MacBook-style laptop, iPhone) in HTML and CSS without logos.

### Motion and scroll effects
- Every section responds to the scroll wheel (scroll-linked fade and slide), not just a one-time fade.
- Signature effects that worked well:
  - **Laptop scroll showcase:** the lid opens as you scroll, the screen cycles through demo sites, an iPhone slides in and overlaps the corner. White background.
  - **Sticky scroll story:** a phone stays pinned while steps scroll past, with a center timeline and a dot fixed at the middle of the screen.
  - **Portfolio carousel:** auto-scrolling sideways in a loop, pauses on hover, every card clickable. No scroll bars, no bullet lists.
  - **Count-up stats** when a section scrolls into view.
- Respect `prefers-reduced-motion`.
- The iPhone mockup screen must fill its frame edge to edge (thin bezel, content stretches to the bottom).

### Sections that convert
1. Hero with clear promise and two buttons (see demos, get a free mockup).
2. Recent work (real portfolio).
3. What missing a website costs you: **real, sourced stats** with a "without a site / with us" comparison and a moving visual for each.
4. Facebook vs. a real website comparison.
5. Demo styles (clickable live mini-sites).
6. Pricing with plain-English terms and add-ons.
7. How it works (three steps).
8. Local trust section (guarantees).
9. FAQ as a foldable list (no boxes), detailed answers.
10. Contact or free preview form.

### FAQ
- Foldable rows separated by thin lines, numbered, plus/minus toggle. No boxes.
- Answers are specific: real prices, real terms, real timelines.

---

## 5. Content and honesty

- **Stats must be sourced.** Put the source in small print under the number. Prefer recent, traceable research. Avoid stats that cannot be traced (for example, an old "62% of calls go unanswered" claim from a tiny 2016 study).
- **Demo sites are labeled as demos.** Reviews, names and ratings inside demos are sample content. Keep the "Demo · sample content" label visible.
- **Never claim terms the business does not offer.** If plans have a minimum term, do not say "no long-term contracts."
- **Check demo business names** against real local businesses before showing them to prospects.
- **Contracts and service agreements get reviewed by an attorney** before real clients sign.

---

## 6. Riverbend pricing (current)

| Plan | Price | Term | File ownership |
|---|---|---|---|
| Essentials | $79/mo + $499 setup | Month-to-month, 14 days' notice | Client owns files once setup is paid |
| Growth (most popular) | $149/mo, $0 down, first payment due at launch | 6-month minimum, then month-to-month | After 6 consecutive payments |
| Partner | $299/mo, $0 down, first payment due at launch | 6-month minimum, then month-to-month | After 6 consecutive payments |

- Early exit on $0-down plans before 6 months: one-time $299 fee.
- Add-ons: photo shoot $150 to $300, logo $150 to $250, QR menu and table tents $75, online ordering or reservations setup $150, extra page $100 each, email or text club $49/mo, Google Business Profile management only $99/mo.
- Market context: $0-down managed website plans commonly run about $149 to $599/mo; Google Business Profile management alone commonly runs $125 to $400/mo. Riverbend sits at the friendly low end on purpose. Do not compete with Wix on price; sell "done for you."
- Whenever pricing changes, update **every** place it appears: pricing cards, terms strip, FAQ, service agreement (plan cards, summary boxes, term text, ownership text), chat assistant answers, and the hero or guarantee wording.

---

## 7. Service agreement modal

- Header with logo, email, city and today's date filled in automatically.
- Plan picker that highlights the chosen plan and updates amount due, monthly price, term, early-exit fee, ownership and what's included.
- Client fields: business name, owner or manager, phone, email (validated).
- Signature: draw (finger, stylus or mouse) or type. Requires an "I'm authorized to sign" checkbox.
- After signing: lock the form, show a signed stamp with date and time.
- Print / Save as PDF prints only the agreement in a clean black-and-white layout (light version of the logo).
- `window.print()` is blocked inside sandboxed previews; it works on the live site.

---

## 8. Chat assistant (scripted, no AI)

- Round launcher in the bottom-right corner using the **logo** as the icon, always visible. On phones it sits above the sticky bottom buttons.
- Clean white panel, logo avatar, no pill chips. Links inside answers are plain text links.
- Auto-opens once per visit on desktop. On phones show a small greeting bubble instead of a full-screen takeover.
- Large question bank (Riverbend: 76 topics, 1,200+ phrasings) with typo, plural and filler-word tolerance.
- Professional tone, no emoji. If it does not know: "Please contact us at [email]."
- Be honest: it is an automated assistant with pre-written answers. Do not call it AI.

---

## 9. Security checklist

- [ ] Content-Security-Policy meta tag limiting scripts, styles, fonts, images and connections to known sources, plus `upgrade-insecure-requests`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- [ ] `<meta name="referrer" content="strict-origin-when-cross-origin">`.
- [ ] Nothing on the page loads over plain `http`.
- [ ] User-typed text is only ever inserted with `textContent`, never `innerHTML`.
- [ ] Chat and forms: cap input length, strip control characters, rate limit, and only render links from a fixed allow-list.
- [ ] No secrets, API keys or private data in the page source.
- [ ] Chat assistant makes no network calls and stores no conversations.
- [ ] Note: **SOC 2 is an audit of a company's practices, not something a website can be "compliant" with by code.** Never claim SOC 2 on a site unless the business has passed the audit.

---

## 10. Common mistakes to avoid (learned the hard way)

- **Class name collisions.** Generic names like `.pub`, `.trade`, `.lounge` used in two places caused white boxes behind headlines. Prefix component classes (for example `w-pub`, `mp-tr`).
- **Over-broad selectors.** `.hero .wrap` also hit the trust strip inside the hero. Use `.hero > .wrap`.
- **Old CSS overriding new CSS.** An old `.reveal{opacity:0}` rule further down the file hid the FAQ. Remove the old rule when replacing a system.
- **Sticky offsets.** When the header height changes, update `scroll-padding-top` and the hero's negative margin.
- **Phones:** check that floating buttons do not cover the sticky bottom bar, long labels wrap instead of overflowing, and pinned mockups do not hide the text they explain.
- **Text inside dark sections:** buttons and cards inherit white text. Set text colors on cards explicitly.
- **Fonts and photos may not load in the build environment.** Check them on the live site before saying they work.
- **Public artifacts cannot be republished** from a session. Publish a new version or update from claude.ai.

---

## 11. Final QA before telling the owner it's done

- [ ] Desktop and phone screenshots reviewed.
- [ ] No JavaScript errors in the console.
- [ ] Every button and link goes where it says.
- [ ] Demos open, tabs switch, forms validate, agreement signs and prints.
- [ ] Chat assistant answers the top 30 questions correctly and falls back to "contact us."
- [ ] Prices and terms match in every section.
- [ ] No em dashes, no emoji in the interface, no placeholder text.
- [ ] Pushed to `main`, Render shows the deploy as Live, live site checked after a hard refresh.

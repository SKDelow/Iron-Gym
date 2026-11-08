# IRON GYM / FORGED

A bespoke, responsive, front-end gym website concept designed in original HTML, CSS, JavaScript and SVG. **This is an interactive demonstration, not a connected live gym business.**

## Open the site

Open `index.html` in a browser or host the folder using a local development server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/`. Google Fonts loads when internet access is available; carefully selected system-font fallbacks are included.

## Deploy on Netlify

Upload the entire folder or ZIP to Netlify's manual deploy interface, or connect it to a GitHub repository. The site is static: **no build step, Node.js, framework, or paid package** is required. `netlify.toml` sets the publish folder to the repository root.

> Do not promote the demonstration website as a real, bookable gym until the data, disclosures, policies, and backend integrations are updated.

## Change the content

Edit `config.js` for business identity, facility location, hours, membership prices, social URLs, and API integration endpoints. Classes, coach biographies, amenities and FAQ content are sample data in clearly labeled sections of `app.js`; you can replace them there with verified gym data. Main editorial copy and section structure is in `index.html`. Color, layout and animation variables are at the top of `styles.css`.

### Placeholder photography

All photographs currently use **original SVG concept placeholders**, not stock imagery or images purporting to depict this real gym. Files are in `assets/`:

- `hero-room.svg` — hero architectural equipment scene
- `training-room.svg` — The Standard section scene
- `coach-1.svg`, `coach-2.svg`, `coach-3.svg` — fictional illustrated people, not actual staff
- `progress-before.svg`, `progress-after.svg` — illustrative slider art, not a real client outcome
- `iron-mark.svg`, `grain.svg`, `select-arrow.svg` — original interface assets

Replace `url('assets/hero-room.svg')` and `url('assets/training-room.svg')` in CSS with your real optimized images, or replace coach `<img>` paths in `app.js`. Maintain appropriate image dimensions and useful alt text. Use written image consent for authentic client transformation examples. Avoid claiming simulated data represents real gym activity.

The SVG files are source code and can be edited in a text editor, Figma or Illustrator. `make_assets.py` is included for reproducibility of the illustrated placeholders.

## What works today

- Responsive header, phone navigation, sticky phone CTAs, keyboard and reduced-motion support
- Five-question Program Finder with recommendations for Open Gym, Performance or Coaching+
- Twenty sample weekly class sessions, filterable by weekday, type, coach and intensity
- Class detail preview, plus downloadable `.ics` **demo calendar events**
- Monthly/annual plan comparison, annual savings and dynamic effective monthly prices
- Cost-per-visit calculator using visits per week and selected billing frequency
- Simulated gym-occupancy meter with hourly demand forecast and refresh button
- Expandable coach profiles, booking-preview modal and free-pass pathway
- Pointer-draggable and keyboard-accessible range-slider comparison featuring original illustrative artwork
- Original SVG icon system for training classes and facility amenities
- Three-option first-visit guide with contextual instructions
- FAQ accordion, free-pass client-side validation, success animation and reset
- Config-driven map iframe when a real address is supplied
- Semantic HTML, headings, alt text, focus states, deferred JS, lazy-loaded coach images, and conditional ExerciseGym JSON-LD when an actual address is supplied

## Features not connected yet

The site is intentionally honest about its demo status.

| Feature | Currently | Production requirement |
| --- | --- | --- |
| Membership purchase | Interactive plan choice and price illustration | Real pricing, policies and checkout or lead-capture provider |
| Class booking | Class modal and downloadable sample event | Scheduling API / booking platform, coach availability and authentication if needed |
| Coach session booking | Coach information and demo inquiry path | Real coach calendar, paid scheduling or qualified lead workflow |
| Free day pass | Client-side validation and *preview* success (nothing saved or sent) | Secure backend endpoint, notifications, consent/privacy policy and spam protection |
| Live capacity | Explicitly simulated percentage | Verified occupancy API returning `{ "percent": 35, "people": 35 }` |
| Testimonials, photos, staff | Clearly labeled editorial examples | Actual permissioned materials and accurate member quotes |
| Local map and hours | Clearly marked blank until configured | Real address, hours and confirmed service locations |
| SEO | Editable metadata, semantic markup and conditional ExerciseGym schema | Final canonical URL, domain-specific sitemap, verified address, Search Console setup |

## Optional endpoints

`config.js` supports `integrations.occupancyEndpoint` and `integrations.freePassEndpoint`. The form will only send data when `liveFormsEnabled: true`, a secure `privacyPolicyUrl`, and the endpoint are all configured.

**Capacity:** Secure API endpoint should return JSON like `{ "percent": 42, "people": 42 }`. If it fails, the interface intentionally falls back to labeled simulation. Configure CORS and authentication appropriately, with secrets stored on the server—not in the browser.

**Free pass:** A server endpoint accepts `POST` JSON `{ name, email, goal, preferredDay }` and returns a non-error status only after handling the request. Add rate limiting, bot protection, legal/privacy disclosures, email confirmation, and integration-specific anti-CSRF protection as applicable. Ensure the UI text and form disclosure are updated to match the actual processing. Do not collect users' personal information until you have a privacy notice and secure handling.

`integrations.bookingProviderUrl` is a reserved configuration value for a future booking provider; it is **not wired to a checkout or live booking system**.

## Performance and accessibility

Vanilla JS, no client framework, no giant animation bundle, CSS/SVG-driven artwork, one Google Fonts stylesheet, lazy-loading on coach portraits, Intersection Observer for reveals and stat counters, and user `prefers-reduced-motion` respected. Native `dialog`, semantic `details`, visible focus outlines, labeled form controls and image descriptions are used. Run a formal WCAG audit with production imagery, real content and any external booking widgets before launch.

## Before a real launch

1. Confirm actual city, gym address, business details, contact info and real opening hours.
2. Confirm membership fees, renewal/cancellation terms, waiver requirements and taxes.
3. Replace coach portraits, names, testimonials, transformation illustrations and all illustrative stats with verified content.
4. Replace room illustrations with high-quality original facility photography and optimize images to WebP/AVIF.
5. Connect and fully test secure free-pass form/booking/checkouts, including failure states, confirmation emails and mobile use.
6. Ensure map, class times, timezone, accessibility and legal/consent/privacy notices are accurate.
7. Update metadata, canonical URL, domain sitemap and structured data after a real address and domain are known.
8. Perform real-device QA, Lighthouse and accessibility testing before declaring production-ready.

---

Design concept: **IRON GYM / FORGED — Built for the Work**. The visual direction is deliberately dark, gritty, professional and clean: iron black, gunmetal, forged copper and bone white, with the original barbell-mark and motion line motif.

## 2026 design refinements — Forged update

This iteration incorporates select concepts from the Lovable 2026 design-trends roundup while preserving the established dark / copper industrial identity. Changes include expressive CSS-only hero typography, a custom layered weight-plate emblem, restrained functional motion for choices and CTAs, and subtle desktop-only asymmetry. All CSS motion respects `prefers-reduced-motion`. No WebGL, AI API, animation library, or additional tracking dependency was added.

The Program Finder now includes an **optional** “Save my starting point” control. It stores only the recommended plan and training category in local browser storage (never quiz answers, email, or behavioral history), shows a returning-visitor reminder, and supports one-click clearing. It makes no server requests.

Reference: https://lovable.dev/guides/website-design-trends-2026
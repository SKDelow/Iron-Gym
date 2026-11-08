# Iron Gym / Forged — Portfolio Gym Website

A seven-page, mobile-first gym website concept in HTML, CSS and vanilla JavaScript.

**Important:** Iron Gym is a *fictional portfolio brand*, not an operating fitness facility. All current photography-like imagery is AI-generated and depicts a fictional gym, not an operating facility. Coach names and profiles, membership rates, testimonials and schedule data are fictional examples. No memberships, bookings or day-pass submissions are processed.

## Pages
- `index.html` — concise photographic homepage; Tour → Classes/Memberships → First Visit
- `tour.html` — interactive five-stop AI-generated facility tour
- `classes.html` — filterable sample class schedule and simulated crowd forecast
- `memberships.html` — three example membership tiers, price toggle, effective-cost calculator and FAQ
- `coaches.html` — illustrative coach profiles with AI-generated Iron Fitness polo portraits
- `about.html` — facility details, illustrative amenity list, conceptual progress art and example quotes
- `visit.html` — three-step roadmap, personalized first-visit guide and *non-submitting* pass preview

`programs.html` and its five-question Program Finder have intentionally been removed.

## Hosting and updates

Static site, no build required. GitHub: `SKDelow/Iron-Gym` on `main`. Netlify: https://iron-gym-forged.netlify.app/ (publish directory `.`).

## Photography

Images currently load from `images.unsplash.com` with consistent color grading in CSS. They are licensed portfolio-use examples from different actual facilities, not photos of a single gym. Replace with a cohesive, fully approved facility shoot before adapting this to a real client's gym. Photo credits are appreciated but not required under the standard Unsplash License: https://unsplash.com/license. People visible in stock images should not be represented as specific staff or clients.

## Demo limitations

`config.js` holds placeholder city, address, hours, pricing, and integration settings. Simulated occupancy is labeled as such; all class sessions and staff profiles are demonstrations. The pass form is intentionally disabled from collecting information until a verified backend and privacy notice are supplied. Do not publish fake customer claims.

To launch for a real gym: confirm business identity, location, prices, class roster, staff, policies, approved photography and reviews; wire secure booking and contact integrations; run real-device accessibility and performance QA.


## AI-generated visual assets (portfolio concept)
Ten locally hosted WebP images in `assets/` were generated specifically for this demonstration. They include three fictional coach portraits with Iron Fitness-branded polo shirts, and seven gym interiors/training views designed to appear as one consistent fictional gym. Images are illustrative; the gym, staff identities, services, and business contact details are not verified as real. Do not represent the portraits as actual staff photographs.


## Forged motion system
Cross-page transitions use a short, non-blocking copper progress stroke, with a gentle arrival animation and a bfcache-safe return state. Fine-pointer visitors get subtle magnetic CTA feedback and spotlighted photo cards. A hand-authored barbell/rack outline draws in the desktop hero. The existing IntersectionObserver reveal system adds one-time photo lifts. All enhancements disable gracefully under `prefers-reduced-motion`, and touch users retain native scrolling/swiping. No additional JS or animation libraries.

### Typography readability update (November 2026)

Improved text sizing and spacing across all seven pages. Body copy defaults to a legible 16px, mobile CTAs and nav are larger, and form controls meet a 16px mobile input font size. Major display headlines keep their industrial design. Check phone, tablet, desktop, and reduced-motion variants when editing these styles.
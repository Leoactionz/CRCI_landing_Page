# CRCi Hub site

Redesigned CRCi Hub website: home, About, How it works, Tracks (with level finder), Impact, FAQs, live reading demo, 4-step enrollment, sign-in and six role portals (Guardian, Student, Teacher, Volunteer, Sponsor, Donor).

## Run it

**Option A: no install.** Double-click `index.html`. Everything works offline except the Google Fonts (Outfit, Figtree, Literata, JetBrains Mono), which fall back to system fonts without internet.

**Option B: local dev server (recommended).** Needs Node 18+.

```bash
npm install
npm run dev        # opens http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the build
```

## Structure

```
index.html        All pages live here; routing is hash based (#about, #enroll, #portal ...)
css/styles.css    Design tokens (light + dark), layout and components
js/app.js         Router, page transitions, GSAP/ScrollTrigger animations, WebGL hero shader,
                  enrollment wizard, sign-in, portals, demo session, FAQ search
assets/kid.webp   Hero photo (from the current CRCi site)
vendor/           GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (local copies, no CDN needed)
```

## Notes

- Forms are a working front-end preview: nothing is sent to a server. Hook `#wiz` (enrollment) and `#signinForm` submit handlers in `js/app.js` to your API.
- Portal figures are sample data.
- Theme follows the visitor's system setting; the sun/moon button switches it and remembers the choice.
- Brand colours: deep #022C22, primary #15803D / #16A34A, bright #22C55E, light #4ADE80, forest #064E3B.
# CRCI_landing_Page

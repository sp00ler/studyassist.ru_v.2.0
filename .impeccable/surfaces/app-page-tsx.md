---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

## Scope
Homepage (`app/page.tsx` and its composed home components) — Persuade mode. Full visual-world replacement of the incumbent dark/lime SaaS-template look.

## Direction contract

THESIS: Retro-computing skeuomorph as a literal, functioning UI shell, not a decorative header — the site opens as a room with a 90s beige PC, and clicking the monitor IS the navigation into the product. Refuses the category's generic corporate-template hero.

OWN-WORLD: Beige/ivory CRT + system-gray chrome; a Netscape-Navigator-era browser bezel (title bar, back/forward/reload/home buttons, address bar) as the literal recurring navigation frame; animated LED system (power solid green, HDD/CD-ROM blinking on an interval, not static) on the tower; pixel-art rendering for the room/PC illustration; once "inside" the browser, typesafe.ai-derived bold flat color-block sections, oversized grotesk display type, sharp 0-radius corners, halftone/dot-grain texture, small floating "OS-window" chrome cards as a secondary motif.

STORY: Visitor lands in a nostalgic bedroom-PC scene; the monitor shows a teaser + "click to enter" prompt inside a mini browser window. Click → monitor zooms/expands, Netscape chrome unfolds to fill the viewport. Visitor is now "browsing" StudyAssist's real offer (services, pricing, proof, order form) as a pixel-styled, boldly colored site inside that chrome, with chrome buttons wired to real behavior (home = back to hero scene, back/forward = in-page section history, reload = replay entrance).

FIRST VIEWPORT: Full-bleed pixel-art bedroom — wallpaper backdrop (reference: `E:/ideas/img/oboi.jpg`), beige tower with floppy + CD-ROM drives and blinking LEDs, CRT monitor showing the teaser inside a mini Netscape window, small cactus bottom-left, shelf decor (statuettes/frames). Primary action is the monitor itself, not a button below the fold.

FORM: Pinned by explicit user brief + owner-supplied reference images (`E:/ideas/img/desktop.webp`, `netscape.jpg`, `netscape-navigator-9-download-interface.png`, `oboi.jpg`) and owner-named reference site (typesafe.ai). Concept-seed dice roll skipped per "brief-pinned direction beats the roll, always." No seed key.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Build path
Code-led, by session decision (not recorded to `.impeccable/config.json` — one-off call for this fast-moving session, owner did not ask to record a standing default). The room/PC/monitor illustration is authored as a real generated pixel-art image asset (image generation is available and clearly the right tool for pixel art); the rest of the surface is built directly in code against this contract, no formal comp-diff gate pipeline.

## What must remain untouched
Order form functionality and full-width usability, pricing/reviews/FAQ content, all legal routes, ChatWidget, ContactsFloat, skip-link accessibility affordance.

## Unresolved decisions
- Exact wording of the monitor teaser / room ambient text: session will draft, owner can edit.
- Mobile composition of the room scene (cropped/simplified vs. full scene) — session will make a call and show it, not block on asking.

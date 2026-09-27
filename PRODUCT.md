# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Russian-speaking university/college students who need paid help with academic work: коллекция услуг по маршрутам /kursovaya (курсовые), /diplom (дипломные), /referat (рефераты), plus subject-matter consultations. They arrive stressed, near a deadline, and are deciding whether to trust an unfamiliar service with money and coursework.

## Product Purpose
StudyAssist sells done-for-you and consultation academic writing/help services (coursework, diploma work, essays, exam-prep consultations) to students. Success is a visitor converting into a submitted order (via the on-page order form) or a chat/contact conversion.

## Positioning
Confidential, fast-turnaround (30–60 min to a consultation), pay-after-review-of-quality model (per existing FAQ copy), uniqueness/anti-plagiarism guarantee. Competing services in this category are visually generic (blue/white corporate templates, stock photos of students) — StudyAssist's owner explicitly wants to break that category rut rather than blend into it.

## Operating Context
Next.js app. Public marketing routes: home (`/`), `/kursovaya`, `/diplom`, `/referat`, `/portfolio`, `/blog`, plus legal (`/offer`, `/refund`, `/privacy`, `/cookies`, `/consent`, `/consent-marketing`) and `/contacts`. Authenticated area: `/auth`, `/dashboard`, `/admin`. Home page composes: UrgencyBar, Navbar, HeroSection, StatsSection, ServicesSection, HowItWorks, PricingSection, ReviewsSection, PortfolioPreviewSection, BlogPreviewSection, OrderForm, FaqSection, Footer.

## Capabilities and Constraints
- Order form on homepage is the primary conversion mechanism; must stay usable at full width, not squeezed into a decorative frame.
- Existing chat widget (ChatWidget) and floating contacts (ContactsFloat) persist across the redesign.
- Git workflow constraint (repo `AGENTS.md`): work only on `codex/*` branches, never edit `main`/`deploy/vds` directly, prepare changes as reviewable diffs, propose a PR from `codex/*` into `deploy/vds` when done, make minimal targeted changes, don't delete files without real need, flag any change touching config/routing/auth/upload/env separately, never touch secrets/.env.
- Working branch for this redesign: `codex/retro-pc-home` (created 2026-09-27 from a cleaned `codex/cinematic-home`, an earlier abandoned "detective dossier" visual direction the user asked to discard).

## Brand Commitments
Name: StudyAssist. No fixed visual identity yet — the incumbent look (near-black background with a lime-green `#C5FF45` accent, glass/blur cards, gradient text, Unbounded display font) is the current implementation but is explicitly disowned by the owner as generic "AI slop" (dark + lime + purple-gradient template look). Treat it as anti-reference, not identity to preserve. Body copy already uses an ivory/cream background (`#EFE8D8`) — this pre-dates the redesign decision below and is superseded by it.

## Evidence on Hand
- Owner-supplied reference images at `E:/ideas/img/`: `desktop.webp` (real beige CRT PC + tower + speakers photo reference), `netscape.jpg` / `netscape-navigator-9-download-interface.png` (Netscape Navigator browser chrome reference), `oboi.jpg` (vintage wallpaper pattern reference for room backdrop).
- Owner-named external design reference: typesafe.ai (bold flat color-block sections, oversized Die Grotesk display type, sharp 0-radius UI chrome, halftone/dot-grain texture, small floating "OS-window" chrome cards as a recurring motif, pixelated glitch-portrait accent) — captured via Firecrawl scrape+screenshot on 2026-09-27, saved to session scratchpad, not the repo.
- No customer testimonials/logos/benchmarks on hand beyond what already ships in ReviewsSection — do not invent new ones.

## Product Principles
1. Break the academic-services category's generic corporate template rather than blending into it — this is an explicit, repeated owner directive, not a style suggestion.
2. Never reintroduce generic-AI-slop tells (gradient text, decorative glass/blur, purple/lime palette-by-default, kicker labels, same-size icon cards) — see project memory `feedback-site-design-taste`.
3. Novelty serves conversion, not the other way around: the order form, pricing, and proof (reviews) must stay fully legible and usable at real content scale, never trapped inside a small decorative frame for the whole page.
4. Preserve all existing functional routes, legal pages, and persistent widgets (chat, contacts float) untouched in behavior.

## Accessibility & Inclusion
No product-specific requirement established beyond standard WCAG contrast/focus expectations already partially implemented (skip link, `sa-fine` cursor toggle). Preserve these.

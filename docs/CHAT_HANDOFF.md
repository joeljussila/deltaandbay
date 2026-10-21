# Shared project context — 12 October 2026

Read this before changing the site. This document records decisions and results from the website audit and follow-up chat. It is a practical handoff, not a verbatim transcript. GitHub `main` and the deployed source are the authority for what has shipped. Local edits and open branches may contain work from simultaneous chats.

## 20 October 2026: deposit and pricing (Shawn's decision)

- Price section shows only **Founding $8,900** and **Early bird $9,900**; Regular and Final call are removed for now. Note under the table: "A $500 deposit holds your place and your price."
- "When do I pay?": $500 deposit invoiced, due within 7 days; balance by 30 November; deposit non-refundable if the traveller cancels but the place is transferable; trip runs only if 15 have paid in full by 30 November, otherwise full refund including deposit. Replaces the 30%/72-hour and minimum-10 wording. Matches booking contract v1.3 in the planning folder.
- Shenzhen page "Join us" says "paid in full by 30 November" to match.

## 20 October 2026 update (supersedes older design notes below)

- Started from current main `9ac7361`, including Shawn's PRs #9–#11. Current homepage title is **Bridging Frontiers**, in Michroma, with the existing lockup and colours preserved.
- User's screenshots 1 and 8 refer to the homepage itinerary logos and the `/shenzhen/` company wall. All 8 + 27 marks now link to their company websites with accessible names and keyboard focus styles.
- Screenshots 2–3: hero subtitle is **San Francisco to Shenzhen**, with more space below the title. Removed the extra Why Shenzhen link below the application button and the redundant ~20 places display. The header navigation still links to the Shenzhen page.
- Screenshots 4–5: removed the Shenzhen hero's date badge and moved its skyline attribution to footer Photo credits. Attribution remains available; do not silently discard licensed photo credits.
- Screenshots 6–7: **Shenzhen up close** and **In numbers** use ivory Michroma at the same size as Itinerary. No decorative blue dots remain on published pages. Text and gallery share the left gutter; each gallery photo has its own caption below it.
- Gallery follow-up: removed the inherited `.band .shot` centering constraint that misaligned photos on wide screens. It now uses a clipped, animated carousel with one explicit selected photo, labelled Previous/Next buttons and no native horizontal scrollbar. Rapid clicks advance consecutive photos; keyboard and mobile swipe navigation are supported. Heading, photo, caption and controls share a left-aligned container up to 1240px wide. New behavior tests cover rapid clicks, bounds, keyboard access and swipe direction; all 22 tests pass.
- Follow-up logo request: `site-header.css` and `images/deltaandbay_lockup_spaced_ivory.svg` are shared by the homepage, Shenzhen, Apply and Privacy. The outlined wordmark sits 180 SVG units lower (about 7px on desktop), its visible left edge shares the page gutter, and the original monogram shape is unchanged. Homepage title has an optical offset for Michroma's B side bearing so its visible edge aligns with the subtitle and CTA.
- Reviewed homepage, Shenzhen, application and Privacy on desktop and narrow mobile layouts. Header wraps on small phones so Apply stays visible. Existing form/video tests: 19 pass. No database or application submission behavior changed.
- These updates leave the inherited commercial text and photography intact. Internal notes, tests and archived design pages remain excluded from deployment by `.vercelignore`.

## Historical production baseline

- Repository: https://github.com/joeljussila/deltaandbay
- Production: https://deltaandbay.com, Vercel project `deltaandbay`, automatically deployed from `main`.
- Latest code baseline at this handoff: `1787a70`, following logo/privacy changes `3552e66`, social preview commits `096e35d`/`56019d8`, and privacy update `83ac9d8`. The live homepage was checked after fetching: it still used the serif “delta and bay” wordmark, not the local Montserrat proposal.
- Static HTML; no framework or build step. `vercel.json` rewrites `/` to `3d-night/`. Application: `/apply/`; privacy: `/privacy/`.
- `styles/`, `fonts/`, `type/` and `brand/` are historical design explorations. They do not override the production homepage.
- Run `node --test tests/*.test.mjs`. The 15 existing tests passed after the privacy changes: eight form tests and seven video tests. Later logo/heading changes were checked visually on desktop and mobile, with all twelve logo images loading and no mobile horizontal overflow.

## User decisions to preserve

- Tagline is exactly **Bridging the Frontiers**. Earlier “Breaching” and “Leave the future in Shenzhen” wording was superseded.
- A week in Shenzhen, the hardware capital of the world; dates 11–17 January 2027. Application does not commit the applicant to anything.
- Earlier navigation was Intro / Price / FAQ / Apply. A simultaneous chat's shipped commit `1787a70` superseded this: navigation is now **Intro**, **FAQ**, **Apply**, Price sits below FAQ, and the price wording includes tax. Preserve that newer arrangement. Button: **Apply for a place**. Privacy heading: **Privacy**.
- Approved colours: solid Prussian blue `#050A30`, ivory `#ECE8E0`. User rejected purple/violet and newly added decorative gradients. Do not restore the abandoned gradient artwork or compositing treatments from earlier commits.
- Use Shawn's existing vector monogram `images/deltaandbay_monogram_ivory.svg`. Brand reference was `syqgenesis/sz-trips`, branch `claude/focused-euler-hw4jrr`, commit `fd42b97da18129ab06f6ddd72d38277696799ebe`.
- Visible top of the top-left logo aligns with the visible navigation text on desktop and mobile, including application and privacy pages. Existing header offsets implement this; do not recenter them casually.
- Application hand remains on desktop, moved left twice: first 3 CSS cm, then another 2 CSS cm. Current rule: `right:calc(-6vw + 5cm)`. CSS cm are not a guaranteed physical screen measurement. Hand is hidden at widths up to 640px.
- Application introduction is exactly **Applying doesn't commit you to anything.**
- Latest approved branding is **delta & bay**, lowercase with an ampersand, on the homepage, application and privacy pages including accessibility labels and sharing metadata. The user selected tagline option **A: Instrument Serif, upright regular**, and requested it a little smaller. Final tagline sizing is approximately 15% smaller than the preceding production version: desktop `clamp(21px,2.65vw,39px)`, mobile `clamp(21px,5.45vw,26px)`. `font-options/` remains the comparison archive; A is now approved.

## Hero video: final implementation

- User's affected device: iPhone 14 Pro, Safari. User wants background playback without visible play/pause controls.
- Native `<video>` has muted autoplay, loop, `playsinline`, `webkit-playsinline`, and preload. Portrait and landscape sources are declared directly in HTML.
- Files: `video/deltaandbay_hero_blue_portrait.mp4` (864×1080), `_blue_1080.mp4` (1920×1080), `_blue_720.mp4` (1280×720 compatibility fallback); poster `images/deltaandbay_hero_blue_poster.jpg`.
- Video and poster are directly graded blue. Skyline opacity is `.85` on desktop and mobile. Mobile crop zooms in. Preserve the current colour treatment.
- Playback retries on media readiness, user gestures, page visibility and page restoration. Decoder error attempts the smaller fallback once. Reduced Motion does not silently disable the video, following the user's explicit preference.
- Browser/OS autoplay restrictions can still require interaction. No implementation can guarantee playback under every phone power-saving or browser setting. Tests verify the retry logic; they do not replace physical-device testing.

## Applications and Supabase

- 14 October notification setup is live: Resend verified the domain; the user-confirmed sending-only key is scoped to deltaandbay.com and stored in Supabase Vault. Migration 20261015010000 installs the private outbox, INSERT trigger and active Cron dispatcher. The live form test omitted X, saved QA application f401a1c4-6350-48fa-b1c9-b23c656c980f, and automatically sent its notification on the first attempt (HTTP 200). Resend confirms delivery to info@deltaandbay.com, and the user confirmed receipt with a matching Gmail Inbox screenshot on 14 October. The full form-to-inbox flow is verified. No applicants were emailed or old applications backfilled. See `docs/APPLICATION_NOTIFICATIONS.md`.

- 13 October update: X is optional. A blank/whitespace X field is submitted as `null`; malformed nonblank X input is still rejected. LinkedIn remains required. Migration `20261013190000_optional_x_profile.sql` was applied through the signed-in Supabase SQL editor and recorded in migration history; the live `applications_links_required` constraint now checks only `linkedin is not null`. The X-format constraint remains. All 17 form/video tests pass, including blank-X submission and malformed-X rejection. Privacy wording reflects the optional field.

- Project ref `kmbhcqnkbiddppzbubxp`, US West region; REST inserts into `public.applications`. Public publishable key is intentionally client-side; never expose a service-role key.
- Audit found RLS enabled, public INSERT only with new status; anonymous read/update/delete denied. No database triggers were found during the original audit; the notification trigger was added on 14 October. Deployed migration versions matched repository migrations during the audit. Recheck if another chat changes the database.
- Form normalises website/profile URLs, validates required fields and lengths against database limits, prevents invalid submissions, and recovers from HTTP/network failures without losing answers or showing false success.
- One labelled production QA application was submitted and read back: record `6ef5f8f8-0829-4157-8780-d853d0e49d2a`, company “QA TEST — not a real application”. Exclude it from real outreach. It was retained; do not assume it has been deleted.
- Supabase dashboard was healthy with no advisor findings at audit time, but showed **no backups**. Backup arrangements remain an open operational item.
- New-application notifications are now automatic through Resend (14 October update above). Application review, interview invitations and applicant follow-up remain manual; this integration only notifies the team.
- If changing form fields, coordinate HTML inputs, client `FIELDS`, SQL schema, grants and validation. Do not submit additional production test applications without a clear need.

## Privacy policy

- Removed the unsupported two-business-day response guarantee; requests are handled within applicable legal time limits, with identity verification and legal exceptions where relevant.
- Corrected “only the team can read” to describe authorised team/provider access. Replaced the blanket “only what you type” and “no tracking” statements with actual application, communication and technical-data disclosures.
- Supabase stores applications in the US; Vercel hosts the site; Google Fonts serves fonts. Providers receive IP/request data. No added advertising trackers or analytics tools were found in the site's code during the review.
- Existing promises remain: no sale/advertising use, ask before sharing what applicants build with hosts/suppliers, delete applications within 12 months after the trip ends, and ask before retaining details for future trips.
- Removing policy text does not erase earlier promises. The retention deadline needs an actual operational process; no automated deletion process was verified.
- Operating legal entity/jurisdiction remains unconfirmed. `docs/company-and-payments.md` in the original planning folder discusses possible structures; it is not evidence of incorporation or actual payment-provider setup. This review was not a legal compliance sign-off.

## Company logo review

All twelve marks were compared visually with current official-site header/footer assets. SF Express, BYD, ZeroErr, Orbbec, Daimon Robotics, UBTECH, EngineAI, LimX Dynamics, DJI, BrainCo and Seeed Studio matched the current shapes. Newer file dates alone do not imply a changed design.

Apollo Go was the exception: the old row used Baidu's parent-company paw. It now uses the official Apollo Go wordmark at `images/hosts/apollo-go.svg`, with the link https://apollogo.com/. The row remains labelled **Companies on the provisional itinerary**; logos do not mean confirmed partnerships. References and results: `images/hosts/logo-review-2026-10-12.csv`.

## Change history and collaboration

- PRs #3–#7 covered mobile launch fixes, colour/video quality, native mobile playback, header alignment, and Shawn brand restoration. Later user requests superseded the gradient portions of that work.
- Final direct commits: `e7cd6f0` removed decorative gradients and graded media blue; `69544d8` matched mobile opacity; `bd4a937` moved the application hand again; `2e2b642` shortened application intro; `83ac9d8` clarified privacy; `3552e66` capitalised Privacy and corrected Apollo Go.
- Simultaneous-chat commits discovered by fetching: `096e35d` added sharing metadata, favicon and preview image; `56019d8` sharpened the preview image; `1787a70` moved Price below FAQ, added tax wording and removed Price from navigation/facts. These are part of the current baseline.
- Original working folder had an unresolved README merge and existing staged brand files. Preserve unrelated work. `.audit-work` was a separate clean clone, but simultaneous chats have since edited its homepage. At handoff, those uncommitted edits included Montserrat and “Delta & Bay”; their approval/deployment status was not verified. This handoff/font-preview task uses another isolated checkout.
- Before editing: fetch GitHub, inspect branch/status/diff and reread this file. Record new approved decisions here. Before reporting “deployed”: verify the live domain actually serves the new content; a push or successful Vercel status alone can precede the domain updating.
- Keep credentials, real applicant records and private personal details out of GitHub context documents. The operational summary is intentional; the full conversation is not published verbatim.

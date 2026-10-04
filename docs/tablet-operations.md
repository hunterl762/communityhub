# Community branding and tablet operations

Apply migrations 005–010 in order on an existing installation, including 010_tablet_operations.sql. Restart the website and update/restart communityhub. API credentials remain in server config.lua. No new packages are required.

## Administration

Admin → Appearance & tablet controls SQL-backed community logo and feature switches. Admin, management and owner may upload/remove a PNG/JPEG/WebP logo up to 256 KB; no image file is written to local uploads. The existing owner Community settings control still sets the name. Website, tablet and HUD use that name and logo, with initials as the fallback. Changes reach connected tablets on their next profile refresh (30 seconds).

Website applications appear in the tablet when enabled. Disabling that switch blocks all tablet catalog/form/submission endpoints while leaving website applications available. Applications use the same SQL forms, questions, answers, review history and cooldown. Discord membership is rechecked on submission. Required fields, allowed choices and answer lengths are validated server-side. Retry references prevent duplicate successful submissions.

Dispatch, CAD, HUD and panic have separate switches. Dispatch/CAD switches also gate the shared website operations workspace. Operational feature flags and current roles are rechecked for every action; the HUD switch controls display.

## Dispatch and CAD

Dispatch & CAD is available to linked department recruits/members/reviewers and department command/staff/admin/management/owner. Command and staff roles create/assign/close calls and maintain roleplay person/vehicle/BOLO records. Department members respond, mark on scene and clear their own response. Admin/management/owner review in-game reports. Records are community-maintained roleplay CAD records; they are independent of QBCore citizen tables.

The live map plots real GTA world coordinates sampled server-side with OneSync during each configured heartbeat. Missing samples display GPS unavailable. It is a coordinate map with a north indicator, not a street-tile map. Web operations refresh every five seconds; tablet/HUD operations refresh every ten seconds while visible or on duty with the HUD enabled. Positions themselves update at Config.HeartbeatSeconds. No license identifiers or API keys appear in the map data.

Panic creates a priority P1 call using the requesting player's server-derived position. Repeated panic requests reuse that player's open panic call. New calls appear as targeted tablet notifications for authorized users. Route sets the requesting client's waypoint only after server approval. Call responses and closure are logged in SQL.

## In-game controls

- F6 / the configured tablet command opens the tablet.
- F7 or /hubhud toggles the mini duty HUD; it appears while clocked in and the tablet is closed.
- F9 or /hubpanic raises a panic alert when permitted and enabled.
- Light/Dark is a personal tablet appearance preference. HUD/theme preferences use FiveM resource preferences; operational records, submissions and community branding use SQL.
- Optional HudCommand/HudKey/PanicCommand/PanicKey settings live in client/config.lua. Existing custom tablet bindings remain supported.

## Validation

Run the existing tests/*.cjs regression scripts and tests/fivem-http.lua. For SQL integration, run node tests/tablet-operations-integration.cjs <checkout> <installation-root>. This applies migration 010 and uses temporary fixture rows, restoring feature/logo settings and removing fixture data on completion. Discord membership is stubbed only inside that test; production uses Discord's membership endpoint. Run SQL integration in an isolated test database when other users are active.

The UI was verified with synthetic desktop/mobile browser previews. Final GTA waypoint, server coordinate sampling and keyboard behavior require an in-game check after restart communityhub.

## Postal map and report submissions (migration 011)

Apply 011_postals_reports.sql and restart the website/resource. The bundled 1,687-point new-postals.json dataset comes from [DevBlocky/nearest-postal](https://github.com/DevBlocky/nearest-postal); its MIT license is retained under third-party/nearest-postal. No additional postal resource is needed. The website and tablet use the same dataset. The interactive coordinate map supports postal search, zoom, drag-to-pan, and verified in-game routing. Postal numbers appear on zoomed views and unit/call details; the map does not contain street-image tiles.

The client calculates its nearest postal every two seconds for the tablet and HUD. The API derives unit and call postals from server-sampled GPS. In-game report submissions and panic requests capture server-owned coordinates, with unavailable GPS left empty. Entering a postal on a new dispatch call resolves its coordinates; arbitrary supplied postal labels cannot overwrite calculated values.

The tablet separates Submit report from the admin/management/owner-only Report submissions tab. Report read/update actions check current SQL role/activity and server scope, independently of dispatch/CAD switches. Report review has been removed from the tablet Dispatch/CAD section; the existing website review section remains available. Reports are cleared on tablet close, account changes, access loss and failed reads.

## Public website content
Apply migration 012_public_website.sql after 011. Admin, management and owner can use Admin > Website content to edit shared descriptions, the public website origin, landing-page sections, About text and Gallery. Saved text is rendered as escaped plain text with paragraph breaks. The original member landing redirect remains; /home provides the public landing page for signed-in previews. About and Gallery do not require sign-in. Gallery accepts PNG/JPEG/WebP images up to 4 MB, stores bytes in SQL, supports captions/order/drafts and recoverable removal; drafts/removed images are blocked by the public image route. Content writes require both the current active SQL admin role and the editing session token.

Open Graph and Twitter summary metadata use the community name, custom description and versioned public logo URL. Set Public website address to your externally reachable origin (or configure BASE_URL); Discord cannot fetch localhost. Preview services may cache cards after settings change. No private application/report data is included in metadata. See https://ogp.me/ for the Open Graph fields.

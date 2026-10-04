# Community branding and tablet integration

Apply migrations 005–013 in order. Migration 013 disables the retired CAD/dispatch/panic flags without deleting saved records. Update/restart the website and communityhub resource. Credentials remain in server config.lua. No new packages are required.

## Features and administration

Admin → Appearance & tablet controls the SQL-backed community logo, in-game application availability and mini duty HUD. Admin, management and owner can upload/remove PNG/JPEG/WebP logos up to 256 KB. The owner Community settings control still sets the name. Website, tablet and HUD use the configured name/logo, refreshed every 30 seconds.

The tablet retains account linking, profile/personnel, live units, shared web/game patrol clock, training/calendar, announcements, report submission/review, website applications, private admin chat, light/dark appearance and the duty HUD. Application forms share SQL questions, validation, answers, reviews, cooldowns and retry references with the website; Discord membership is verified on submission. Turning off tablet applications does not disable website applications.

CAD/MDT, dispatch calls, person/vehicle lookup, BOLOs, panic alerts, live dispatch maps and waypoint routing are removed from both interfaces, API routes and the FiveM feature allowlist. Old /operations and /api/fivem/operations/* routes return 404. Historic call/CAD tables are retained; no migration drops records. The duty HUD now shows community identity, duty start and nearest postal without assigned calls.

## Controls and location

- F6 / the configured tablet command opens Community Hub.
- F7 or /hubhud toggles the duty HUD while clocked in and the tablet is closed.
- Light/Dark and HUD visibility are personal resource preferences; community data and patrol logs use SQL.
- HudCommand/HudKey remain in client/config.lua. Retired panic bindings in an existing custom config have no registered command.

The bundled 1,687-point new-postals dataset comes from [DevBlocky/nearest-postal](https://github.com/DevBlocky/nearest-postal), with its MIT license retained under third-party/nearest-postal. The client displays its nearest postal every two seconds. Reports capture trusted server GPS and derived postal in SQL; missing GPS remains unavailable. No additional postal resource is needed.

Submit report and Report submissions remain separate tabs. Read/update endpoints are /api/fivem/reports/read and /api/fivem/reports/update. Current active SQL admin/management/owner role and enabled server scope are checked; they do not rely on retired dispatch flags. Private data is cleared on tablet close, account changes, access loss and failed reads. Client requests cannot select another license or server.

## Validation

Run tests/navigation.cjs, tests/appearance.cjs, tests/fivem-api.cjs and tests/fivem-nui.cjs. SQL tests/postals-reports-integration.cjs validates removed routes, report role/server boundaries and retained GPS/postals; tests/tablet-operations-integration.cjs retains application/branding checks. Tests use temporary SQL fixtures and restore settings. Final keyboard/HUD behavior requires an in-game check after restart communityhub.

## Public website content
Apply migration 012_public_website.sql after 011. Admin, management and owner can use Admin > Website content to edit shared descriptions, the public website origin, landing-page sections, About text and Gallery. Saved text is rendered as escaped plain text with paragraph breaks. The original member landing redirect remains; /home provides the public landing page for signed-in previews. About and Gallery do not require sign-in. Gallery accepts PNG/JPEG/WebP images up to 4 MB, stores bytes in SQL, supports captions/order/drafts and recoverable removal; drafts/removed images are blocked by the public image route. Content writes require both the current active SQL admin role and the editing session token.

Open Graph and Twitter summary metadata use the community name, custom description and versioned public logo URL. Set Public website address to your externally reachable origin (or configure BASE_URL); Discord cannot fetch localhost. Preview services may cache cards after settings change. No private application/report data is included in metadata. See https://ogp.me/ for the Open Graph fields.

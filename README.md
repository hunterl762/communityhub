# Community Hub

Node.js + Express + EJS + MySQL/MariaDB community management portal for FiveM roleplay communities.

## Included modules
- Discord OAuth-ready authentication foundation
- Dynamic department/community applications
- Applicant application tracking and review workflow
- Reports for FailRP, VDM, RDM, NLR, metagaming, powergaming, staff/player reports, bugs and other incidents
- Community and training calendars
- Admin-managed training events
- Admin document drive with folders and uploads
- Role/permission-ready admin dashboard
- Audit log database design
- MySQL/MariaDB schema

## Quick start
1. Copy `.env.example` to `.env` and fill in values.
2. Import `sql/schema.sql` into MySQL/MariaDB.
3. Run `npm install`.
4. Run `npm run dev` or `npm start`.
5. Open `http://localhost:3020`.

Never commit `.env` or uploaded private documents.

### Admin workspace and shared navigation

The Admin dashboard now groups workspace tools separately from application and report review queues. FiveM configuration is available from the dashboard, the Administration navigation, and the shared Staff menu for admin, management and owner roles. Reviewers retain review access; department command and staff retain community management access. Members & Roles remains limited to admin and owner, and Community Settings to owner.

The shared navigation groups Community, Operations, Staff and Account links, uses keyboard-accessible disclosure menus, closes on Escape or outside clicks, and expands inline on mobile. Guests see Home and Discord login.

FiveM Configuration shows saved server settings, server keys, recent heartbeat information, credential creation and last-use dates, revocation status, MDT announcements and resource setup instructions. Web settings do not modify config.lua or schedule restarts. Heartbeats refresh hostname and player capacity. The existing enabled flag is configuration metadata, not an API-access switch.

Run the role-aware navigation, authorization, template and FiveM rendering checks with:

```sh
node tests/navigation.cjs
```

These checks use sample data and do not connect to MySQL or a FiveM server.


### Troubleshooting FiveM requests

After updating the website and resource, restart both. Set Config.ApiBase in fivem/communityhub/config.lua to the reachable website URL ending in /api/fivem. 127.0.0.1 works only when FiveM and the website run on the same machine (and network namespace). Use the final HTTPS URL rather than a redirect. Set Config.ApiKey to an active generated credential and Config.ServerKey to the key shown in Admin > FiveM Configuration.

Run communityhub_test in the FiveM server console to check API reachability, authentication and server configuration. Failures now show actionable HTTP errors in the console and tablet instead of a generic Request failed. Database/schema failures return JSON with migration guidance. The API is mounted before website sessions and rate limiting; authenticated telemetry has a separate 10,000-request/15-minute budget per IP, while failed requests retain a 500-request budget.

/link takes the six-digit code generated on the website FiveM page, not a player/account ID. Codes expire after five minutes. Command results also appear in chat when the tablet is closed.

The manifest now loads config.lua only on the server. Tablet command/key settings live in client/config.lua. If you used a real API key with the old shared-script manifest, revoke that key in Admin > FiveM and generate a replacement, since game clients could download the old config.

Regression checks: `node tests/fivem-api.cjs` and `lua tests/fivem-http.lua` (a standalone Lua runtime).


### Database files and live FiveM status (migration 007)

Import sql/migrations/007_database_files_status.sql after 006 before restarting the website. New document uploads use in-memory multipart handling and store the bytes plus a SHA-256 checksum in document_contents. Metadata remains in documents. Downloads preserve existing sign-in requirements; upload permissions remain department command/staff/admin/management/owner. No new uploaded files are written to local disk.

Set MySQL max_allowed_packet larger than MAX_UPLOAD_MB plus overhead (64 MB is suitable for the default 25 MB upload limit). The upload handler rejects files exceeding the current database packet limit without inserting orphan metadata. Include document_contents in your database backups.

Import existing files from the website folder:

```sh
node scripts/import-document-files.cjs
node scripts/import-document-files.cjs --apply
```

The default is a dry run. The importer is idempotent, checks paths/file sizes/packet limits, skips missing files with a document ID, and never deletes originals. Legacy downloads remain available until imported.

Members can use FiveM > Server status to view availability, player counts, observed 30-day uptime percentages, online/offline duration totals and the latest 100 availability periods. First observation starts history; earlier uptime is not fabricated. The website checks every 15 seconds and records outages from the 90-second heartbeat expiry; heartbeat writes and status transitions are serialized per server in SQL. If monitoring restarts after a gap, a stale last heartbeat bounds the outage until the next heartbeat. Heartbeat availability measures the integration reporting in, not a game-client connection test.

Admin review counts and FiveM status/patrol totals refresh from SQL every 15 seconds while their page is visible, leaving editing forms intact. The member status page refreshes every 15 seconds. The tablet refreshes profile/branding every 30 seconds, and dispatch every ten seconds while visible or on duty with the HUD enabled; background FiveM heartbeats continue at Config.HeartbeatSeconds. Restart the installed resource after updating client/main.lua.


### Patrol time clock, game time and private admin chat (migration 008)

Apply 008_time_clock_chat.sql after 007 and restart the website/resource. /fivem has web clock-in/out and a member's own recent patrol sessions. The admin dashboard shows the latest 100 sessions and a clock event audit with web/game source; these refresh every 15 seconds. Web and game actions lock the same user row, preventing concurrent double clock-ins. Historical sessions remain visible; source events start with this update.

The tablet shows GTA game time from client clock natives. The server requests one connected player's sample each heartbeat and accepts only that requested player's response. Member status cards show the sampled game time, not a guessed progression, and mark stale/empty-server samples unavailable after 90 seconds. Game time is display telemetry, never the basis for logged patrol durations. SQL real time drives the time clock.

Admin Chat is a server-specific, SQL-backed tablet channel for linked admin, management and owner accounts. Every read/send checks the current SQL role using the license derived server-side from the player source. Normal members, reviewers, command and staff cannot read/send. No chat is included in general tablet data or broadcast to all players. Messages are limited to 1,000 characters, ten sends per 30 seconds per user, and the latest 100 messages are polled every five seconds while open.

### Community Hub UI v2 — Theme C

Theme C is the default visual system: a navy application sidebar, light-gray workspace, restrained department accents and a compact dark tablet. Visitors see a separate public homepage; signed-in users land on /overview. The role-aware sidebar and page finder contain only permitted existing tools. Mobile uses Overview / Live / Reports bottom navigation plus a keyboard-accessible drawer. Website Light / Dark / System preferences use a first-party cookie; no application files or records are stored in localStorage.

The member Overview refreshes SQL-derived enabled server availability/player counts, recent active units, upcoming training/events, own applications and current patrol every 15 seconds while visible. Staff review counts are queried only for existing reviewer roles. Table columns exclude FiveM licenses/API credentials. Empty states reflect actual data; no calls/maps/dispatch records are invented. The new Overview requires sign-in on both the initial and update routes.

The redesign preserves the existing account, applications, reports, personnel, department, training, document, admin/FiveM and private chat actions. The tablet uses quick actions and bottom tabs with current-page indicators, labeled report/link/chat inputs and real account-link status. Its existing callbacks and role-checked chat remain intact. Dispatch/CAD workflows, real coordinate maps, panic alerts, the mini duty HUD, tablet applications and appearance administration are included with migration 010. Restart the website and communityhub resource after installing.

### All file types and document removal (migration 009)

Apply sql/migrations/009_document_removal.sql after 008 and restart the website. Department command/staff/admin/management/owner uploads retain their existing permissions. All MIME types and extensions are accepted; MAX_UPLOAD_MB and MySQL max_allowed_packet limits still apply. Files remain SQL-backed, signed-in downloads are sent as attachments, and content sniffing is disabled.

Admin, management and owner accounts can remove a document from the library and restore it from Removed documents. Removal records the administrator and timestamp, hides the document from lists and rejects its download URL for every role. SQL bytes/checksums and legacy originals are retained for restoration; no filesystem deletion or permanent purge is performed. Both mutation routes enforce admin roles independently of the UI.

### Branding, tablet applications and dispatch/CAD (migration 010)

See [tablet operations setup](docs/tablet-operations.md) for permissions, feature switches, sampling/refresh intervals, HUD/panic controls and validation. Admin → Appearance & tablet manages SQL-backed logo and in-game applications. The existing owner settings continue to set the community name. Apply 010_tablet_operations.sql and restart the website/resource. Existing API request limits remain in place, with an additional per-player resource-side feature budget.

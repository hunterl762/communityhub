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

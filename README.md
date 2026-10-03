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
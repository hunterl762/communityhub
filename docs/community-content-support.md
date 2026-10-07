# News, rules and support

Install dependencies (`npm ci`) and apply `sql/migrations/023_community_content_support.sql` after migration 022 before starting this version. Migration 023 adds four tables without changing LMS or existing reports. It is compatible with MariaDB 10.4 and HeidiSQL and can be re-run. No content or sample tickets are seeded.

## Website

- `/news`: published announcements and changelogs, literal search, category filters, tags and summaries. `/news/:id` reads an article.
- `/rules`: published rules grouped by category, native keyboard-accessible disclosure controls, search and last-updated dates.
- `/community/manage`: content library for active `staff`, `admin`, `management` and `owner` accounts. Create or edit news and rules; save as draft, publish or archive. News uses Markdown with embedded HTML and images disabled. Rules are escaped plain text. Archiving hides content without deleting its record.
- `/support`: the member's tickets. Support staff can switch to `/support?queue=1` and filter by status.
- `/support/new`: submit a question, bug, report or appeal. This does not replace the existing reports system.
- `/support/tickets/:id`: private member/staff conversation. Staff replies move it to `waiting_on_member`; member replies move it to `open`. Staff may resolve, close or reopen. Closed tickets reject replies until reopened. Notifications link to the thread; changes are audited without copying message content into audit metadata.

All support operations and content writes check the active database account and role, rather than trusting a stale session role. Department-command and reviewer accounts do not have access to the global private support queue. Every new write form has CSRF protection and a per-account submission limit of 30 requests per 15 minutes. Existing staff permissions elsewhere remain intact.

Lists return at most 100 news posts or tickets. Ticket conversations show the latest 200 messages, in chronological order. Searches are literal; `%` is not treated as a wildcard. Rules currently return all matching published rules.

## FiveM API

The existing API authentication applies to every endpoint below. Include `x-communityhub-key` and `server_key`; server-bound keys must match the server, and disabled servers are rejected. Responses use `Cache-Control: no-store`.

| Method and path | Parameters | Response |
|---|---|---|
| GET `/api/fivem/community/news` | `server_key`, optional `q`, `category` | `ok`, `posts`, `categories`, `q`, `category` |
| GET `/api/fivem/community/news/:id` | `server_key` | `ok`, `post` including original Markdown `body` |
| GET `/api/fivem/community/rules` | `server_key`, optional `q` | `ok`, `rules`, `q` |
| GET `/api/fivem/support/tickets` | `server_key`, `license` | `ok`, linked member's `tickets` |
| GET `/api/fivem/support/tickets/:id` | `server_key`, `license` | `ok`, `ticket`, `messages` |

Only published news and rules are exposed. Ticket endpoints require an active linked account and return only its own conversations, including when that linked account is staff. The API has no support-write endpoint or staff queue. Obtain `license` from the FiveM server's player identifiers rather than accepting arbitrary client identity. Credentials remain server-only. Future NUI consumers must render rule/ticket text with `textContent` and sanitize any Markdown rendering; API news bodies are not trusted HTML.

The existing NUI is unchanged in this increment. These endpoints are the foundation for adding its news, rules and support tabs.

## Validation and troubleshooting

For a disposable MariaDB instance, set `$env:COMMUNITY_TEST_PORT='33318'` in PowerShell and run `node tests/community-support.cjs`. The test creates and drops its own isolated database. It covers migration replay, draft visibility, publication, safe Markdown, literal search, ticket isolation, live-role enforcement, replies and closure, atomic rollback, CSRF and scoped API authentication. Existing navigation/template and FiveM regression tests should continue to pass.

If the new pages report missing tables, verify migration 023 was run in the website's configured database. If a member cannot see a ticket, confirm ownership and active-account status; another member's ticket intentionally returns 404. A 403 on a form may indicate expired CSRF state: reload the form and submit again. If a server-key request is rejected, match `server_key` to the key's assigned server in FiveM configuration.

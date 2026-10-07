# CommunityHub V3 UI & Product Specification

CommunityHub V3 moves away from generic SaaS dashboard styling and toward a purpose-built FiveM community operations console. This specification is the implementation contract for the V3 web and in-game redesign.

## Design principles

1. Information first. Every visible metric must represent real data and link to the records behind it.
2. Dense, deliberate layouts. Avoid oversized cards, excessive whitespace, decorative gradients, glassmorphism and glow.
3. Restrained surfaces. Use charcoal/navy surfaces, thin borders/dividers and one primary brand accent.
4. Compact geometry. Default controls and panels should use approximately 6–10px radii rather than pill/rounded-card styling everywhere.
5. Clear hierarchy. Typography, spacing and grouping should communicate importance before decoration does.
6. Native context. The website should feel like an operations application; F6 should feel like an in-game operations interface, not a responsive website placed over GTA.
7. Real interactions. Summary counts must drill down. Status indicators must reflect actual integration state. No fake dashboard metrics.
8. Accessible and responsive. Preserve light preference and keyboard/focus behavior while building distinct desktop and mobile compositions.

## Product navigation

Primary authenticated navigation should progressively move toward:

- Command Center
- People
- Departments
- Workflows
- Training
- Operations
- Communications
- Insights
- Integrations
- Administration

Do not rename routes merely for appearance when it would break compatibility; labels can migrate before route names.

## Command Center

The authenticated home becomes an operational briefing rather than a grid of generic cards.

### Header
- Community identity and selected FiveM server.
- Live/offline/degraded integration state.
- Current local/server time where useful.
- Compact server switcher for multi-server communities.
- Quick actions based on the signed-in user's permissions.

### Operational summary
Show compact, clickable metrics for:
- FiveM players online / capacity.
- Staff currently on duty.
- Pending applications.
- Open/reviewable reports.
- Training requiring action.
- Upcoming events.
- Integration/API health.

Each metric must link or open a filtered view containing the underlying records.

### Live activity
Add a chronological operations stream using existing events where possible:
- player joined/left;
- staff duty started/ended;
- application submitted/reviewed;
- report submitted/status changed;
- training activity;
- announcement publication;
- integration/server state changes.

Activity rows use timestamp, actor/subject, event label and source (Web, FiveM, Discord/API where available). Avoid large decorative icons.

### Upcoming work
A compact agenda combines training/calendar events and actionable deadlines. Prefer list/table presentation to cards.

## People

Create a unified member view around the existing SQL account/personnel data. The long-term member record should join community identity with permitted Discord and FiveM identifiers, departments/ranks, application history, training/certifications, staff activity and reports relevant to the user's permissions.

Profile pages should use a compact identity header plus tabbed/sectioned history, not independent statistic cards for every field.

## Staff management

Progressively add SQL-backed:
- leave of absence requests;
- probation status and dates;
- promotions/demotions;
- department transfers;
- staff notes with author/timestamp;
- disciplinary records;
- activity requirements;
- evaluations;
- training/certification history.

All sensitive actions require server-side role checks and audit records. Do not trust client-provided roles.

## CommunityHub Flow

Build an SQL-backed automation engine rather than hard-coding isolated automations.

A workflow consists of:
- trigger;
- optional conditions;
- ordered actions;
- enabled/disabled state;
- server/community scope;
- execution history;
- creator/updater audit metadata.

Initial trigger candidates:
- application submitted/approved/denied;
- training/certification completed;
- member/staff inactivity threshold reached;
- staff duty state changed;
- FiveM integration/server state changed;
- report submitted/status changed.

Initial actions:
- assign/update department or rank where permitted;
- assign training;
- create internal notification;
- send supported Discord role/notification action;
- create an audit/activity event;
- flag a record for staff review.

Workflow execution must be idempotent where external retries can occur and failures must be recorded rather than silently swallowed.

## F6 / CommunityHub In-Game

Replace the current tablet-like responsive composition with a purpose-built overlay.

### Persistent shell
- Community/server identity.
- Player identity.
- Department/rank where available.
- Duty state and elapsed duty time.
- Integration status.
- Compact close/keybind affordance.

### Navigation
Desktop/wide NUI uses a narrow navigation rail. Smaller resolutions use a compact bottom bar or drawer without horizontally overflowing labels.

Primary in-game areas:
- Home
- Profile
- Duty
- Training
- Events
- Reports
- People (permission gated)
- Communications

Administration remains permission gated and should not overload the default player UI.

### Home
Prioritize actionable content:
- duty action/status;
- current/upcoming event or training;
- unread/recent announcement;
- relevant report/application actions for staff;
- current server/player state.

Avoid duplicating the web Command Center in miniature.

## Integration Center

Provide a single operational view for configured FiveM servers and other supported integrations. Show status, last successful heartbeat/sync, credential state (never secret values), recent failures and setup/diagnostic actions.

## Audit Center

Create a consistent audit model for privileged changes. Records should support actor, action, entity type/id, server/community scope, timestamp, source and safe before/after metadata. Never log secrets, raw credentials or unnecessary sensitive identifiers.

## Insights & Impact

Use real stored data only. Initial insights can include player/community activity trends, staff duty coverage, training completion, application processing and integration uptime.

Impact should quantify actual platform work such as workflow executions, processed applications, training completions, synchronized actions and uptime. Do not invent estimated hours saved unless an explicit, documented calculation is implemented.

## Implementation order

1. Introduce V3 design tokens and component rules without breaking existing routes.
2. Recompose authenticated dashboard into Command Center using existing data.
3. Update navigation labels/grouping and mobile behavior.
4. Recompose F6 shell and Home around player/duty context.
5. Build unified People/Staff views on current data.
6. Add migrations/services for new staff-management records.
7. Add workflow schema, execution service and audit trail.
8. Add Integration Center/Audit Center.
9. Add analytics/Impact from real accumulated data.
10. Perform desktop, mobile and NUI regression/accessibility testing.

## V3 visual review checklist

Reject a screen during review if it relies on giant metric cards, repeated icon-in-rounded-square decoration, gratuitous gradients/glow, excessive empty space, fake metrics, identical layouts for web and F6, or controls that exist only for appearance.

Approve when the screen communicates hierarchy quickly, exposes real operational state, uses compact purposeful components, works at target mobile/NUI widths, and every action is backed by permission-checked functionality.

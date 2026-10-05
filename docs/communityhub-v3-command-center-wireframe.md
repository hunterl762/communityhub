# CommunityHub V3 Command Center Wireframe

The Command Center should read like a live operations briefing, not a marketing dashboard.

## Desktop composition

```text
COMMUNITYHUB / COMMAND CENTER                         [Server: Primary v]  ● LIVE
Eastcoast Gaming                                      API 24s ago · 47/128
──────────────────────────────────────────────────────────────────────────────

47 / 128 PLAYERS     12 STAFF ON DUTY     7 APPLICATIONS     3 OPEN REPORTS
[View players]       [View duty roster]    [Review queue]     [Open reports]
──────────────────────────────────────────────────────────────────────────────

LIVE ACTIVITY                                      UPCOMING / ACTION REQUIRED
22:41  FiveM   Smith connected                    23:00  Staff meeting
22:39  FiveM   J. Davis started duty              Tomorrow LSPD training
22:36  Web     Application #184 approved          4 applications awaiting review
22:31  Web     Announcement published             3 certifications nearing expiry
22:27  FiveM   Report #62 submitted               1 integration warning
[View activity]                                    [View all work]
──────────────────────────────────────────────────────────────────────────────

INTEGRATIONS
FiveM Server       ● Healthy     last heartbeat 24s ago
Community API      ● Healthy     last request 8s ago
Database           ● Available   checked recently
Discord            ○ Not configured / status when supported
```

The exact metrics shown depend on data actually available to the signed-in user. Do not fabricate unavailable integration checks.

## Mobile composition

Mobile becomes a prioritized briefing, not the desktop grid squeezed into one column.

```text
COMMAND CENTER                         ● LIVE
Primary Server                         47 / 128
────────────────────────────────────────────

NEEDS ATTENTION
7 Applications                 Review >
3 Open Reports                  Open >
1 Integration Warning           View >
────────────────────────────────────────────

ON DUTY                         12 staff  >
────────────────────────────────────────────

LIVE ACTIVITY
22:41 Smith connected
22:39 J. Davis started duty
22:36 Application #184 approved
                                  View all >
────────────────────────────────────────────

UPCOMING
23:00 Staff meeting
Tomorrow LSPD training
```

## Interaction rules

- Metric counts are links, not decorative numbers.
- Avoid hover-only functionality; mobile/touch must have the same capabilities.
- Server selector changes scoped data only after authorization.
- Degraded/offline integrations explain what is stale and when the last successful update occurred.
- Pending work is ordered by urgency/age where possible.
- Activity source labels remain subtle and text-readable; do not rely only on color.
- Loading uses compact skeleton rows rather than large animated cards.
- Empty states explain what will appear and, where authorized, how to configure it.

## Visual identity rules

- No giant welcome hero inside authenticated operations pages.
- No glowing gradient borders around ordinary panels.
- No four identical floating statistic cards with oversized icons.
- No decorative charts when a table/list communicates the state better.
- Use uppercase micro-labels sparingly for operational labels.
- Prefer tabular numerals for counts/times when supported.
- Use one accent for interactive emphasis; reserve success/warning/danger colors for state.

# CommunityHub V3 Implementation Plan

This checklist converts the V3 product specification into reviewable implementation slices.

## Phase 1 — Visual foundation

- [ ] Define shared V3 color, spacing, radius, typography, border, focus and status tokens.
- [ ] Reduce default panel radius and remove unnecessary glow/gradient treatments.
- [ ] Create compact panel, section header, data row, status badge, metric link, timeline row and empty/error state patterns.
- [ ] Preserve light appearance support.
- [ ] Verify keyboard focus and contrast.
- [ ] Audit desktop and mobile navigation for overflow and unnecessary nesting.

Acceptance: existing functionality remains usable while screens visibly share the V3 operations-console language.

## Phase 2 — Command Center

- [ ] Inventory existing dashboard queries/data before adding new queries.
- [ ] Build server/integration header and server switcher.
- [ ] Add linked operational metrics backed by real records.
- [ ] Add live/recent activity feed from existing events/logs.
- [ ] Add upcoming training/calendar agenda.
- [ ] Add actionable pending-work list.
- [ ] Ensure empty/degraded/offline states are useful.

Acceptance: an administrator can understand current community/server state and reach the records behind each summary without hunting through navigation.

## Phase 3 — Navigation and terminology

- [ ] Introduce Command Center label for authenticated home.
- [ ] Group member/personnel functions under People where permissions allow.
- [ ] Group operational FiveM/community functions coherently.
- [ ] Keep route compatibility during label migration.
- [ ] Keep guest/public navigation simple.
- [ ] Test every role on desktop and mobile.

## Phase 4 — FiveM in-game V3

- [ ] Replace generic tablet shell with compact operations overlay.
- [ ] Persistent player identity, rank/department, duty state and integration state.
- [ ] Rebuild Home around current player actions instead of web-dashboard metrics.
- [ ] Simplify wide-screen navigation rail.
- [ ] Build small-screen bottom navigation/drawer.
- [ ] Preserve reports, training, calendar, announcements, personnel and admin capabilities according to permissions.
- [ ] Verify F6 and `/hub`, focus release, ESC close and configured bindings.

Acceptance: screenshots should clearly look like an in-game tool rather than a responsive SaaS dashboard.

## Phase 5 — People & Staff

- [ ] Unified member profile presentation on existing data.
- [ ] Add SQL migrations for LOA, staff notes, probation, staff actions/evaluations as required.
- [ ] Add server-side services and permission checks.
- [ ] Add promotion/demotion/transfer history.
- [ ] Add training/certification history.
- [ ] Add audit records for privileged mutations.

## Phase 6 — CommunityHub Flow

- [ ] Migration for workflow definitions, conditions/actions and execution history.
- [ ] Server/community-scoped workflow service.
- [ ] Trigger dispatcher.
- [ ] Condition evaluator using allowlisted condition/action types.
- [ ] Ordered action executor.
- [ ] Idempotency/retry strategy.
- [ ] Failure history and safe diagnostics.
- [ ] Workflow list/editor UI.
- [ ] First production triggers/actions integrated with applications and training.

Security: never execute arbitrary user-provided code/SQL; workflow types and parameters must be allowlisted and validated server-side.

## Phase 7 — Integration & Audit Centers

- [ ] Integration status/last heartbeat/recent failure view.
- [ ] Safe credential lifecycle actions without exposing secrets.
- [ ] Consolidated audit search/filter/detail view.
- [ ] Source labels for Web/FiveM/API and Discord when supported.

## Phase 8 — Insights & Impact

- [ ] Activity trends.
- [ ] Staff coverage/duty trends.
- [ ] Training completion.
- [ ] Application processing.
- [ ] Integration uptime.
- [ ] Workflow execution counts.
- [ ] No invented savings metrics.

## Regression gate

Before V3 is considered complete:
- [ ] Existing migrations still apply in documented order.
- [ ] Existing API credentials remain compatible unless explicitly migrated.
- [ ] Cross-server requests remain denied.
- [ ] Inactive/stale accounts cannot gain permissions from client state.
- [ ] Removed CAD/MDT routes remain removed.
- [ ] No horizontal overflow on supported mobile widths.
- [ ] F6/NUI has no stuck focus.
- [ ] Light/dark appearance remains readable.
- [ ] Public About/Gallery and authentication continue working.
- [ ] All dashboard metrics are traceable to real data.

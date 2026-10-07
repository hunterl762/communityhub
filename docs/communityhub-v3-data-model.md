# CommunityHub V3 Data Model Plan

This is a migration plan, not a replacement for existing tables. Reuse current accounts, roles, servers, applications, reports, training, announcements and telemetry where appropriate.

## Staff records

Proposed logical entities:

### staff_profiles
Server/community-scoped staff metadata that does not belong on the base authentication account: probation state/dates, activity requirement configuration/reference and staff lifecycle status.

### staff_actions
Immutable promotion, demotion, transfer, appointment and separation history. Store actor, subject, action type, safe reason/note, old/new department/rank references where applicable and timestamp.

### staff_notes
Permission-controlled internal notes with author, subject, server scope, created/updated timestamps and optional visibility class. Do not expose through member-facing endpoints.

### staff_leave_requests
Subject, leave start/end, safe reason, status, reviewer and decision metadata.

### staff_evaluations
Evaluator, subject, period, structured rating fields if required and comments. Permissions must distinguish self-view from supervisor/admin access.

## Certifications

Keep training definitions separate from member completion/credential state. A certification record should support issue/completion time, issuer/instructor, optional expiration, status and source training reference. Renewal creates history rather than destructively hiding prior completion.

## Operational activity

Prefer a normalized append-only `activity_events` concept that can receive safe references to existing application/report/training/duty/integration events. Suggested fields:

- id
- server_id/community scope
- event_type (allowlisted)
- actor_account_id nullable
- subject_type / subject_id nullable
- source (`web`, `fivem`, `api`, `discord` when supported)
- safe summary metadata JSON
- created_at

Do not put credentials, access tokens, full request payloads or unnecessary personal identifiers in metadata.

## Audit

Audit differs from activity: activity explains what is happening operationally; audit records privileged mutations and before/after state for accountability. Existing audit/log structures should be reused if sufficient rather than duplicated.

## Workflows

### workflows
id, server/community scope, name, description, trigger_type, enabled, creator/updater and timestamps.

### workflow_conditions
workflow_id, order/group, allowlisted condition type, validated JSON configuration.

### workflow_actions
workflow_id, action order, allowlisted action type, validated JSON configuration.

### workflow_executions
workflow_id, trigger/event reference, idempotency key, state, started/completed timestamps and safe error summary.

### workflow_action_executions
execution/action reference, state, attempt metadata and safe result/error summary.

Never support arbitrary SQL, shell commands, Lua, JavaScript or templated code execution as a workflow action.

## Integration state

Where current FiveM status/heartbeat tables are sufficient, reuse them. Integration Center can project a common read model instead of forcing all integrations into one table immediately.

## Migration principles

1. Additive migrations first; preserve historical records.
2. Foreign keys/indexes for common server, subject, status and time queries.
3. Server scope on every new operational entity that can exist in a multi-server installation.
4. Backend derives actor identity and authorization from the session/API credential, never client fields.
5. Store timestamps consistently with the existing project convention.
6. Add retention controls later for high-volume activity/execution records.
7. New tables require matching authorization tests before UI exposure.

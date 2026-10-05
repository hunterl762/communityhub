# CommunityHub V3 Security Review Requirements

V3 adds staff records, workflows and broader operational visibility. These features must not weaken the existing server-bound authorization model.

## Authorization

- Derive authenticated user and role from trusted server-side session/account state.
- Derive API identity/server scope from validated server-bound credentials.
- Never accept client-supplied role, actor ID or server scope as authorization.
- Recheck current active role for sensitive mutations; stale UI state is not authority.
- Every object read/update must be constrained to an authorized community/server scope.

## Workflow engine

- Trigger, condition and action types are allowlisted enums/registrations.
- Validate each action configuration with a strict schema.
- Never execute arbitrary SQL, JS, Lua, shell commands or dynamic code supplied by users.
- External side effects require idempotency protection where retries are possible.
- Rate limit high-impact workflow actions.
- Record execution/failure state without leaking credentials.
- Consider recursion protection when an action can produce another workflow trigger.

## Staff/private records

- Staff notes, discipline and evaluations need explicit read/write permissions separate from ordinary member profiles.
- Member-facing profile endpoints must not accidentally serialize private staff fields.
- Use parameterized queries through the project's established DB layer.
- Preserve an immutable history for promotions/demotions/transfers rather than trusting only current UI state.

## Activity and audit metadata

Do not record:
- passwords;
- API keys or hashes where unnecessary;
- OAuth/access/refresh tokens;
- session cookies;
- raw Authorization headers;
- arbitrary request bodies;
- unnecessary FiveM identifiers or personal information.

Before/after audit data should be field allowlisted or sanitized.

## UI

- Hiding a navigation item is not authorization.
- All underlying endpoints enforce the same or stronger permission checks.
- Escape rendered user/community content according to output context.
- Avoid injecting workflow labels/configuration with raw HTML.
- CSRF protection/session conventions already used by the project must extend to new web mutations.

## Multi-server regression

Tests should prove:
- credentials for server A cannot create/read/update server B operational records;
- a web user without server B access cannot reach B by editing IDs/URLs;
- disabled/inactive accounts lose access regardless of an open page;
- workflow execution cannot cross its configured scope;
- activity/audit search does not leak records across scope.

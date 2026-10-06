# Duty HUD, elapsed clock and postal provider

Update the website and the complete `fivem/communityhub` resource together. Restart `communityhub`. No SQL migration is required.

The NUI now tells the client when it is ready, so saved HUD/theme preferences and the first profile request are not dependent on a fixed startup delay. The API returns the active SQL patrol separately from its recent history. Missing HUD settings default to enabled; an administrator's explicit disabled setting is still respected. A linked eligible account, an active patrol, the website HUD setting, and the local HUD toggle are all required. The HUD appears after closing the tablet. The HUD button reports why it cannot show; use `/hubhud` or F7 to toggle it. Check Appearance → Mini duty HUD and clock in through the Duty tab if it remains hidden.

Elapsed time counts up as `HH:MM:SS` in the dashboard duty summary, personal patrol panel, staff time-clock log, in-game Duty tab and mini HUD. It starts from the database's elapsed seconds and refreshes from the existing polls, so reopening the interface does not reset the session. Completed sessions stop counting; clock-out hides the HUD. Refreshing a webpage or restarting the resource does not erase the saved patrol.

In `fivem/communityhub/client/config.lua`:

```lua
Config.Postals = {
    Provider = 'nearest-postal',
    Resource = 'nearest-postal',
    Export = 'getPostal',
    Fallback = true,
    RefreshMs = 2000
}
```

This uses the client `getPostal` export from [DevBlocky's nearest-postal resource](https://github.com/DevBlocky/nearest-postal). Start it before CommunityHub:

```text
ensure nearest-postal
ensure communityhub
```

Resource/export names can be changed for compatible forks. Strings, numbers and `{code=...}` results are supported. A missing/stopped resource, failed export or empty result uses the bundled map when `Fallback=true`; otherwise the display reports postal unavailable. The default `Provider='auto'` prefers the configured external resource whenever it is running. `Provider='builtin'` uses the bundled dataset, and `Provider='disabled'` disables postal display. Refresh intervals have a 500ms minimum.

This provider controls the tablet/HUD postal display. Reports continue using server-derived coordinates and the website's own postal dataset. If the external resource uses a different map, update the bundled dataset to the same map before expecting stored report postals to match. Client-supplied postal codes are not trusted for report records.

Run `node tests/duty-hud.cjs`, the existing FiveM NUI regression test, and `tests/client-postals.lua` with a Lua test runner. Real FiveM connection, startup and native/export behavior should also be checked after deployment; browser and mocked Lua tests do not measure live game performance.

Use `/hubpostal` in game to print the selected provider, postal, and any resource/export failure to chat and F8. If it reports `builtin` with a missing/stopped-resource reason, match `Config.Postals.Resource` to your actual postal resource folder and ensure it before CommunityHub. Client-only postal settings go in `client/config.lua`, not the server API configuration.

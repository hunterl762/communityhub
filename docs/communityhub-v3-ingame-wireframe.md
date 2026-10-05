# CommunityHub V3 In-Game Interface Wireframe

The F6 `/hub` experience should be recognizably part of CommunityHub while being designed specifically for in-game use.

## Wide NUI

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ COMMUNITYHUB    Eastcoast Gaming                              ● CONNECTED │
├────────────┬───────────────────────────────────────────────────────────────┤
│ HOME       │ EASTCOAST_GAMING                           ADMINISTRATION     │
│ PROFILE    │ On Duty · 02:17:43                        Postal 204         │
│ DUTY       │───────────────────────────────────────────────────────────────│
│ TRAINING   │                                                               │
│ EVENTS     │ CURRENT                                                      │
│ REPORTS    │ Duty session active                         [ END DUTY ]      │
│ PEOPLE*    │                                                               │
│ COMMS      │ NEXT                                                         │
│            │ Staff Meeting · 23:00                      [ VIEW EVENT ]     │
│            │                                                               │
│            │ ANNOUNCEMENT                                                  │
│            │ Community operations update · 18 min ago     [ READ ]        │
│            │                                                               │
│            │ STAFF ACTIONS                                                  │
│            │ 4 applications · 3 reports                   [ OPEN QUEUE ]   │
├────────────┴───────────────────────────────────────────────────────────────┤
│ F6 close · Server time 22:47 · API synced 8s ago                          │
└────────────────────────────────────────────────────────────────────────────┘
```

`PEOPLE` and staff actions are permission gated. Ordinary members should not see empty administrator navigation.

## Small NUI

Use a short header, content viewport and icon+short-label bottom navigation. Do not horizontally scroll a long set of full navigation labels. Secondary destinations go into More.

```text
┌──────────────────────────────────┐
│ COMMUNITYHUB        ● CONNECTED │
│ Eastcoast_Gaming · Administration│
├──────────────────────────────────┤
│ ON DUTY                  02:17:43│
│                         [END DUTY]│
│                                  │
│ NEXT                             │
│ Staff Meeting · 23:00            │
│                                  │
│ ANNOUNCEMENT                     │
│ Community operations update      │
│                         [READ]   │
├──────────────────────────────────┤
│ Home  Duty  Training  Reports  ⋯ │
└──────────────────────────────────┘
```

## Behavioral requirements

- F6 and `/hub` continue to open the interface according to configured bindings.
- ESC/close reliably releases NUI focus.
- Duty elapsed time uses authoritative duty state, not a purely client-side fake counter.
- Connection state represents actual heartbeat/API knowledge and shows stale/degraded state when applicable.
- Permission-gated destinations are omitted rather than shown disabled without reason.
- Report submission retains trusted server GPS/nearest-postal behavior.
- Existing appearance preference remains supported, but readability over the game world is mandatory.
- Avoid translucent glass panels that make text dependent on the scene behind the UI.
- Do not copy the web Command Center wholesale into NUI.

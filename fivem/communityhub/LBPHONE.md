# CommunityHub app for LB Phone

The phone-only app reuses CommunityHub's server events and dashboard API. It includes duty clocks, account linking, reports, support conversations, news, rules, training progress, schedules and permission-controlled staff sections. No new SQL migration or website API key is needed. Training and calendar access still follow the dashboard's community Discord checks.

Install/update the `communityhub` resource and preserve both your existing **server `config.lua`** and **client `client/config.lua`**. Add the following to the client configuration if upgrading an existing install:

```lua
Config.LBPhone = {
    Enabled = true,
    Resource = 'lb-phone',
    Identifier = 'communityhub',
    Name = 'Community Hub',
    DefaultApp = true
}
```

Start `lb-phone` and `communityhub` in your server configuration. The app registers using LB Phone exports and registers again after the phone resource restarts. No edits to LB Phone's own files are required. Set `DefaultApp = false` if players should download it from the phone's app store. Set `Enabled = false` to disable app registration. A missing LB Phone resource does not prevent CommunityHub from running.

The app uses the phone's light/dark theme and its own scrolling layout. The phone owns focus and closing; use its normal home/back controls. CommunityHub has no standalone tablet, HUD, chat commands or key bindings. Account linking is done in the app’s Personnel section. API keys stay exclusively in the server configuration.

After installing, restart CommunityHub and verify the app appears on LB Phone, a linked account loads, duty actions update the dashboard, reports/support synchronize, and training permissions apply. Also verify a phone restart, light/dark mode and reopening the phone app. Live LB Phone compatibility must be checked on your server; local tests cover the adapter and browser UI without the licensed phone resource.

Developer reference: https://docs.lbscripts.com/phone/custom-apps/ and https://docs.lbscripts.com/phone/exports/client-exports/

The phone page shares the tablet's scripts and markup. Run `node scripts/build-phone-ui.cjs` after editing `html/index.html` to regenerate `html/phone.html`; keep the generated page in the resource manifest.

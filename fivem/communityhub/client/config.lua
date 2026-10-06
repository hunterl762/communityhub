Config = {}
-- Client-only tablet controls. Server credentials belong in ../config.lua.
Config.TabletCommand = 'hub'
Config.TabletKey = 'F6'

-- Optional HUD and emergency shortcuts. These contain no API credentials.
Config.HudCommand = 'hubhud'
Config.HudKey = 'F7'
Config.HudEnabled = true -- Local default; saved /hubhud preference and website permissions still apply.

-- Use 'builtin', 'nearest-postal', or 'disabled'. External resource/export names are configurable.
Config.Postals = {
    Provider = 'builtin',
    Resource = 'nearest-postal',
    Export = 'getPostal',
    Fallback = true, -- Use our bundled postal map if the external resource is unavailable.
    RefreshMs = 2000
}

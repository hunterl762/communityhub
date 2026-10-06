Config = {}
-- Client-only tablet controls. Server credentials belong in ../config.lua.
Config.TabletCommand = 'hub'
Config.TabletKey = 'F6'

-- Optional HUD and emergency shortcuts. These contain no API credentials.
Config.HudCommand = 'hubhud'
Config.HudKey = 'F7'
Config.HudEnabled = true -- Local default; saved /hubhud preference and website permissions still apply.

-- Use 'badger' for your Badger Essentials postals.lua coordinates (no export needed).
-- 'ocrp' selects the generic OCRP coordinate list instead.
-- Also supports 'auto', 'builtin' (new map), 'nearest-postal', or 'disabled'.
Config.Postals = {
    Provider = 'badger',
    Resource = 'nearest-postal',
    Export = 'getPostal',
    Fallback = true, -- Use our bundled postal map if the external resource is unavailable.
    RefreshMs = 2000
}

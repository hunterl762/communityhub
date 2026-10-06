Config = {}
-- Client-only tablet controls. Server credentials belong in ../config.lua.
Config.TabletCommand = 'hub'
Config.TabletKey = 'F6'

-- Optional HUD and emergency shortcuts. These contain no API credentials.
Config.HudCommand = 'hubhud'
Config.HudKey = 'F7'
Config.HudEnabled = true -- Local default; saved /hubhud preference and website permissions still apply.

-- Use 'ocrp' for ocrp_postal_map artwork (no export needed).
-- Also supports 'auto', 'builtin' (new map), 'nearest-postal', or 'disabled'.
Config.Postals = {
    Provider = 'ocrp',
    Resource = 'nearest-postal',
    Export = 'getPostal',
    Fallback = true, -- Use our bundled postal map if the external resource is unavailable.
    RefreshMs = 2000
}

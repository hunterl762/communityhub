Config = {}
-- Client-only LB Phone and postal settings. Server credentials belong in ../config.lua.

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

-- LB Phone app. No API credentials belong in this client file.
Config.LBPhone = { Enabled = true, Resource = 'lb-phone', Identifier = 'communityhub', Name = 'Community Hub', DefaultApp = true }

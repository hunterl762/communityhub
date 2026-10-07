Config = {}
-- For a server on another computer, use your public website host AND port, ending in /api/fivem.
-- Paste a plain URL, not a Markdown link.
Config.ApiBase = 'http://127.0.0.1:3020/api/fivem'
-- Generate a server API key from Admin > FiveM. Never expose this in client/NUI files.
Config.ApiKey = 'CHANGE_ME'
Config.ServerKey = 'primary'
Config.ServerName = 'Community Roleplay'
Config.MaxPlayers = 64
-- Choose 'standalone' for vMenu/other servers or 'qbcore' for QB-Core servers.
Config.Framework = 'standalone'
-- Tablet controls and Config.Postals are configured only in client/config.lua.

Config.HeartbeatSeconds = 30
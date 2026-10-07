-- Server-only HTTP transport. Never send credentials or raw response bodies to clients.
CommunityHubHttp = {}

local function failure(status, message)
    return {ok = false, status = status, error = message}
end

local function configError()
    if type(Config.ApiBase) ~= 'string' or not Config.ApiBase:match('^https?://') then
        return 'Set Config.ApiBase to the reachable website URL ending in /api/fivem.'
    end
    if not Config.ApiBase:gsub('/+$', ''):match('/api/fivem$') then
        return 'Config.ApiBase must end in /api/fivem (without a query string).'
    end
    if type(Config.ApiKey) ~= 'string' or Config.ApiKey == '' or Config.ApiKey == 'CHANGE_ME' then
        return 'Set Config.ApiKey to an active key generated in Admin > FiveM Configuration.'
    end
end

function CommunityHubHttp.request(method, path, data, cb)
    local invalid = configError()
    local function finish(status, result)
        if not result.ok then
            -- Path can contain a player's license; log only its first segment.
            local endpoint = path:match('^/([^/]+)') or 'api'
            print(('[Community Hub] %s /%s failed (HTTP %s): %s'):format(method, endpoint, tostring(status), result.error))
        end
        if cb then cb(status, result) end
    end
    if invalid then return finish(0, failure(0, invalid)) end
    local url = Config.ApiBase:gsub('/+$', '') .. path
    local serverKey = tostring(Config.ServerKey or 'primary')
    if method == 'GET' then
        -- Include the configured scope for PHP and existing website routes.
        local encodedKey = serverKey:gsub('([^%w%-_%.~])', function(c) return string.format('%%%02X', string.byte(c)) end)
        url = url .. (url:find('?', 1, true) and '&' or '?') .. 'server_key=' .. encodedKey
    elseif type(data) == 'table' and data.server_key == nil then
        data.server_key = serverKey
    end
    PerformHttpRequest(url, function(status, body)
        status = tonumber(status) or 0
        local decoded
        if type(body) == 'string' and body ~= '' then
            local ok, value = pcall(json.decode, body)
            if ok and type(value) == 'table' then decoded = value end
        end
        local message
        if status <= 0 then
            message = 'Cannot reach Community Hub. Check Config.ApiBase, website availability, firewall and TLS. 127.0.0.1 refers to the FiveM server machine.'
        elseif status == 401 or status == 403 then
            message = 'Community Hub rejected authentication. Check Config.ApiKey or your reverse proxy access rules.'
        elseif status >= 300 and status < 400 then
            message = 'The API URL redirects. Set Config.ApiBase to the final website URL ending in /api/fivem.'
        elseif status == 429 then
            message = 'Community Hub request limit reached. Update the website API rate-limit fix and wait for the limit to reset.'
        elseif decoded and decoded.ok == false then
            message = type(decoded.error) == 'string' and decoded.error or 'Community Hub rejected the request (HTTP ' .. status .. ').'
        elseif status == 404 then
            message = 'API endpoint not found. Check Config.ApiBase and deploy the current FiveM website routes.'
        elseif status >= 500 then
            message = 'Community Hub server error. Check website logs, MySQL and migrations 005/006.'
        elseif status < 200 or status >= 300 then
            message = 'Community Hub rejected the request (HTTP ' .. status .. ').'
        elseif not decoded or type(decoded.ok) ~= 'boolean' then
            message = 'Expected a Community Hub JSON response. Check Config.ApiBase and reverse proxy rules; the server may be returning an HTML page.'
        end
        if message then return finish(status, failure(status, message)) end
        finish(status, decoded)
    end, method, data and json.encode(data) or '', {
        ['Content-Type'] = 'application/json',
        ['Accept'] = 'application/json',
        ['x-communityhub-key'] = Config.ApiKey
    }, {followLocation = false})
end

local phoneOpen = false
local registered = false
local cached = {}
local settings = Config.LBPhone or {}
local phoneResource = settings.Resource or 'lb-phone'
local identifier = settings.Identifier or 'communityhub'
local function available() return settings.Enabled == true and GetResourceState(phoneResource) == 'started' end
local function phoneMessage(message)
    if not phoneOpen or not available() or message.type == 'visible' or message.type == 'appearance' then return end
    pcall(function() exports[phoneResource]:SendCustomAppMessage(identifier, message) end)
end
function CommunityHubSendUI(message)
    SendNUIMessage(message)
    if message.type == 'profile' or message.type == 'tabletData' or message.type == 'clockHistory' or message.type == 'postal' or message.type == 'gameClock' then cached[message.type] = message end
    phoneMessage(message)
end
local function register()
    if registered or not available() then return end
    local ok, success, reason = pcall(function()
        return exports[phoneResource]:AddCustomApp({
            identifier = identifier, name = settings.Name or 'Community Hub',
            description = 'Community news, duty, training, reports and support', developer = 'CommunityHub',
            defaultApp = settings.DefaultApp ~= false, size = 200, price = 0,
            ui = GetCurrentResourceName() .. '/html/phone.html',
            icon = 'https://cfx-nui-' .. GetCurrentResourceName() .. '/html/phone-icon.svg',
            onOpen = function()
                phoneOpen = true
                pcall(function() exports[phoneResource]:SendCustomAppMessage(identifier,{type='visible',visible=true}) end)
                TriggerServerEvent('communityhub:getProfile')
            end,
            onClose = function()
                phoneOpen = false
                pcall(function() exports[phoneResource]:SendCustomAppMessage(identifier,{type='visible',visible=false}) end)
            end
        })
    end)
    registered = ok and success == true
    if not registered then print('[CommunityHub] LB Phone app registration failed: ' .. tostring(ok and reason or 'export unavailable')) end
end
RegisterNUICallback('phoneReady', function(_, cb)
    if not available() then cb({ok=false,error='LB Phone integration is disabled or unavailable'});return end
    phoneOpen = true
    cb({ok=true})
    for _, message in pairs(cached) do phoneMessage(message) end
    TriggerServerEvent('communityhub:getProfile')
end)
AddEventHandler('onClientResourceStart', function(resource)
    if resource ~= phoneResource and resource ~= GetCurrentResourceName() then return end
    CreateThread(function() Wait(1000);register() end)
end)
AddEventHandler('onClientResourceStop', function(resource)
    if resource == phoneResource then registered=false;phoneOpen=false end
    if resource == GetCurrentResourceName() and registered and available() then pcall(function() exports[phoneResource]:RemoveCustomApp(identifier) end) end
end)
CreateThread(function() while settings.Enabled == true and not registered do Wait(3000);register() end end)

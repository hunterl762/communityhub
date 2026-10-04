local open=false
local function setTablet(state) open=state;SetNuiFocus(state,state);SendNUIMessage({type='visible',visible=state});if state then TriggerServerEvent('communityhub:getProfile') end end
RegisterCommand(Config.TabletCommand,function() setTablet(not open) end,false)
RegisterKeyMapping(Config.TabletCommand,'Open Community Hub','keyboard',Config.TabletKey)
RegisterNUICallback('open',function(_,cb) setTablet(true);cb({ok=true}) end)
RegisterNUICallback('close',function(_,cb) setTablet(false);cb({ok=true}) end)
RegisterNUICallback('clockIn',function(_,cb) TriggerServerEvent('communityhub:clockIn');cb({ok=true}) end)
RegisterNUICallback('clockOut',function(_,cb) TriggerServerEvent('communityhub:clockOut');cb({ok=true}) end)
RegisterNUICallback('link',function(data,cb) TriggerServerEvent('communityhub:link',data.code);cb({ok=true}) end)
RegisterNUICallback('report',function(data,cb) TriggerServerEvent('communityhub:report',data);cb({ok=true}) end)
RegisterNetEvent('communityhub:profile',function(data) SendNUIMessage({type='profile',data=data});if not data.ok then SendNUIMessage({type='notice',data=data}) end end)
RegisterNetEvent('communityhub:tabletData',function(data) if data.ok then SendNUIMessage({type='tabletData',data=data}) else SendNUIMessage({type='notice',data=data}) end end)
RegisterNetEvent('communityhub:linkResult',function(data) SendNUIMessage({type='notice',data=data});if not open then TriggerEvent('chat:addMessage',{args={'Community Hub',data.ok and 'Account linked successfully.' or data.error or 'Link request failed'}}) end;if data.ok then TriggerServerEvent('communityhub:getProfile') end end)
RegisterNetEvent('communityhub:patrolResult',function(data) SendNUIMessage({type='notice',data=data});if data.ok then TriggerServerEvent('communityhub:getProfile') end end)
RegisterNetEvent('communityhub:reportResult',function(data) SendNUIMessage({type='reportResult',data=data}) end)
-- Refresh SQL duty state and branding for the tablet and mini HUD.
CreateThread(function()
    while true do
        Wait(30000)
        TriggerServerEvent('communityhub:getProfile')
    end
end)

RegisterNetEvent('communityhub:sampleClock',function(token) TriggerServerEvent('communityhub:clockSample',token,GetClockHours(),GetClockMinutes()) end)
RegisterNetEvent('communityhub:clockHistory',function(data) SendNUIMessage({type='clockHistory',data=data}) end)
RegisterNetEvent('communityhub:chatData',function(data) SendNUIMessage({type='chatData',data=data}) end)
RegisterNUICallback('chatRead',function(_,cb) TriggerServerEvent('communityhub:adminChat');cb({ok=true}) end)
RegisterNUICallback('chatSend',function(data,cb) TriggerServerEvent('communityhub:adminChat',data.message);cb({ok=true}) end)
CreateThread(function() while true do Wait(1000);if open then SendNUIMessage({type='gameClock',hours=GetClockHours(),minutes=GetClockMinutes()}) end end end)

local hudEnabled=GetResourceKvpString('communityhub:hud')~='off'
local theme=GetResourceKvpString('communityhub:theme') or 'dark'
RegisterNUICallback('feature',function(data,cb)
    TriggerServerEvent('communityhub:feature',data.kind,data.request_id,data.data or {});cb({ok=true})
end)
RegisterNetEvent('communityhub:featureReply',function(requestId,data)
    if data.ok and data.waypoint and type(data.waypoint.x)=='number' and type(data.waypoint.y)=='number' then SetNewWaypoint(data.waypoint.x,data.waypoint.y) end
    SendNUIMessage({type='featureReply',request_id=requestId,data=data})
end)
local function toggleHud() hudEnabled=not hudEnabled;SetResourceKvp('communityhub:hud',hudEnabled and 'on' or 'off');SendNUIMessage({type='hud',enabled=hudEnabled}) end
RegisterCommand(Config.HudCommand or 'hubhud',toggleHud,false)
RegisterNUICallback('hudToggle',function(_,cb) toggleHud();cb({ok=true}) end)
RegisterNUICallback('appearance',function(data,cb) if data.theme=='light' or data.theme=='dark' then theme=data.theme;SetResourceKvp('communityhub:theme',theme) end;cb({ok=true}) end)
RegisterCommand(Config.PanicCommand or 'hubpanic',function() SendNUIMessage({type='panic'}) end,false)
RegisterKeyMapping(Config.HudCommand or 'hubhud','Toggle Community Hub duty HUD','keyboard',Config.HudKey or 'F7')
RegisterKeyMapping(Config.PanicCommand or 'hubpanic','Community Hub panic alert','keyboard',Config.PanicKey or 'F9')
CreateThread(function() Wait(2000);SendNUIMessage({type='hud',enabled=hudEnabled});SendNUIMessage({type='appearance',theme=theme});TriggerServerEvent('communityhub:getProfile') end)

local open=false
local function setTablet(state) open=state;SetNuiFocus(state,state);SendNUIMessage({type='visible',visible=state});if state then TriggerServerEvent('communityhub:getProfile') end end
RegisterCommand(Config.TabletCommand,function() setTablet(not open) end,false)
RegisterKeyMapping(Config.TabletCommand,'Open Community Hub','keyboard',Config.TabletKey)
RegisterNUICallback('close',function(_,cb) setTablet(false);cb({ok=true}) end)
RegisterNUICallback('clockIn',function(_,cb) TriggerServerEvent('communityhub:clockIn');cb({ok=true}) end)
RegisterNUICallback('clockOut',function(_,cb) TriggerServerEvent('communityhub:clockOut');cb({ok=true}) end)
RegisterNUICallback('link',function(data,cb) TriggerServerEvent('communityhub:link',data.code);cb({ok=true}) end)
RegisterNUICallback('report',function(data,cb) TriggerServerEvent('communityhub:report',data);cb({ok=true}) end)
RegisterNetEvent('communityhub:profile',function(data) SendNUIMessage({type='profile',data=data});if not data.ok then SendNUIMessage({type='notice',data=data}) end end)
RegisterNetEvent('communityhub:tabletData',function(data) if data.ok then SendNUIMessage({type='tabletData',data=data}) else SendNUIMessage({type='notice',data=data}) end end)
RegisterNetEvent('communityhub:linkResult',function(data) SendNUIMessage({type='notice',data=data});if not open then TriggerEvent('chat:addMessage',{args={'Community Hub',data.ok and 'Account linked successfully.' or data.error or 'Link request failed'}}) end;if data.ok then TriggerServerEvent('communityhub:getProfile') end end)
RegisterNetEvent('communityhub:patrolResult',function(data) SendNUIMessage({type='notice',data=data}) end)
RegisterNetEvent('communityhub:reportResult',function(data) SendNUIMessage({type='reportResult',data=data}) end)
-- Refresh while the tablet is open; no requests are sent while it is closed.
CreateThread(function()
    while true do
        Wait(30000)
        if open then TriggerServerEvent('communityhub:getProfile') end
    end
end)

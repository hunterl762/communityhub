local open=false
local function setTablet(state) open=state;SetNuiFocus(state,state);SendNUIMessage({type='visible',visible=state});if state then TriggerServerEvent('communityhub:getProfile') end end
RegisterCommand(Config.TabletCommand,function() setTablet(not open) end,false)
RegisterKeyMapping(Config.TabletCommand,'Open Community Hub','keyboard',Config.TabletKey)
RegisterNUICallback('close',function(_,cb) setTablet(false);cb({ok=true}) end)
RegisterNUICallback('clockIn',function(_,cb) TriggerServerEvent('communityhub:clockIn');cb({ok=true}) end)
RegisterNUICallback('clockOut',function(_,cb) TriggerServerEvent('communityhub:clockOut');cb({ok=true}) end)
RegisterNUICallback('link',function(data,cb) TriggerServerEvent('communityhub:link',data.code);cb({ok=true}) end)
RegisterNUICallback('report',function(data,cb) TriggerServerEvent('communityhub:report',data);cb({ok=true}) end)
RegisterNetEvent('communityhub:profile',function(data) SendNUIMessage({type='profile',data=data}) end)
RegisterNetEvent('communityhub:tabletData',function(data) SendNUIMessage({type='tabletData',data=data}) end)
RegisterNetEvent('communityhub:linkResult',function(data) SendNUIMessage({type='notice',data=data});if data.ok then TriggerServerEvent('communityhub:getProfile') end end)
RegisterNetEvent('communityhub:patrolResult',function(data) SendNUIMessage({type='notice',data=data}) end)
RegisterNetEvent('communityhub:reportResult',function(data) SendNUIMessage({type='notice',data=data}) end)
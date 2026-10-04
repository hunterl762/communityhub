local QBCore=nil
if Config.Framework=='qbcore' then QBCore=exports['qb-core']:GetCoreObject() end
local function licenseFor(src) for _,id in ipairs(GetPlayerIdentifiers(src)) do if string.sub(id,1,8)=='license:' then return id end end end
local request = CommunityHubHttp.request
local function playerEvent(src,eventType) local lic=licenseFor(src);if lic then request('POST','/player-event',{server_key=Config.ServerKey,license=lic,player_name=GetPlayerName(src),event_type=eventType}) end end
AddEventHandler('playerJoining',function() playerEvent(source,'join') end)
AddEventHandler('playerDropped',function() playerEvent(source,'leave') end)
CreateThread(function() while true do Wait(Config.HeartbeatSeconds*1000);request('POST','/heartbeat',{server_key=Config.ServerKey,hostname=Config.ServerName,players=#GetPlayers(),max_players=Config.MaxPlayers});for _,id in ipairs(GetPlayers()) do local src=tonumber(id);local lic=licenseFor(src);if lic then local duty='available';if QBCore then local p=QBCore.Functions.GetPlayer(src);if p and p.PlayerData.job then duty=p.PlayerData.job.onduty and 'on_duty' or 'off_duty' end end;request('POST','/active-unit',{server_key=Config.ServerKey,license=lic,player_name=GetPlayerName(src),duty_status=duty}) end end end end)
RegisterNetEvent('communityhub:getProfile',function() local src=source;local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:profile',src,{ok=false,error='No FiveM license found'}) end;request('GET','/player/'..lic,nil,function(_,body) TriggerClientEvent('communityhub:profile',src,body) end);request('GET','/tablet',nil,function(_,body) TriggerClientEvent('communityhub:tabletData',src,body) end) end)
RegisterNetEvent('communityhub:link',function(code) local src=source;local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:linkResult',src,{ok=false,error='No FiveM license found'}) end;if lic then request('POST','/link',{code=tostring(code),license=lic,player_name=GetPlayerName(src)},function(_,body) TriggerClientEvent('communityhub:linkResult',src,body) end) end end)
RegisterNetEvent('communityhub:clockIn',function() local src=source;local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:patrolResult',src,{ok=false,error='No FiveM license found'}) end;if lic then request('POST','/patrol/clock-in',{license=lic,server_key=Config.ServerKey},function(_,body) TriggerClientEvent('communityhub:patrolResult',src,body) end) end end)
RegisterNetEvent('communityhub:clockOut',function() local src=source;local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:patrolResult',src,{ok=false,error='No FiveM license found'}) end;if lic then request('POST','/patrol/clock-out',{license=lic},function(_,body) TriggerClientEvent('communityhub:patrolResult',src,body) end) end end)
RegisterNetEvent('communityhub:report',function(data) local src=source;local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:reportResult',src,{ok=false,error='No FiveM license found'}) end;if lic then request('POST','/report',{license=lic,server_key=Config.ServerKey,report_type=data.report_type,subject=data.subject,details=data.details},function(_,body) TriggerClientEvent('communityhub:reportResult',src,body) end) end end)
RegisterCommand('link',function(src,args) if src>0 then if args[1] then TriggerEvent('communityhub:serverLink',src,args[1]) else TriggerClientEvent('communityhub:linkResult',src,{ok=false,error='Use /link <6-digit code> from the website FiveM page; this is not your player ID.'}) end end end,false)
AddEventHandler('communityhub:serverLink',function(src,code) local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:linkResult',src,{ok=false,error='No FiveM license found'}) end;if lic then request('POST','/link',{code=tostring(code),license=lic,player_name=GetPlayerName(src)},function(_,body) TriggerClientEvent('communityhub:linkResult',src,body) end) end end)
-- Run from the server console; credentials remain server-side.
RegisterCommand('communityhub_test',function(src)
    if src ~= 0 then return end
    request('GET','/status/'..Config.ServerKey,nil,function(_,body)
        if body.ok then print('[Community Hub] API connection, authentication and server configuration OK.') end
    end)
end,true)

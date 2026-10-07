local QBCore=nil
local heartbeatSeconds=tonumber(Config.HeartbeatSeconds)
if not heartbeatSeconds or heartbeatSeconds<5 or heartbeatSeconds>300 then
    heartbeatSeconds=30
    print('[Community Hub] Config.HeartbeatSeconds is missing or invalid; using 30 seconds. Check server config.lua for startup errors. Postal settings belong in client/config.lua.')
end
if Config.Framework=='qbcore' then QBCore=exports['qb-core']:GetCoreObject() end
local function licenseFor(src) for _,id in ipairs(GetPlayerIdentifiers(src)) do if string.sub(id,1,8)=='license:' then return id end end end
local request = CommunityHubHttp.request
local function unitPosition(src)
    local ok,c=pcall(function() local ped=GetPlayerPed(src);if not ped or ped==0 then return nil end;return GetEntityCoords(ped) end)
    if ok and c then return c.x,c.y,c.z end
end
local clockSample=nil
local clockSequence=0
local function playerEvent(src,eventType) local lic=licenseFor(src);if lic then request('POST','/player-event',{server_key=Config.ServerKey,license=lic,player_name=GetPlayerName(src),event_type=eventType}) end end
AddEventHandler('playerJoining',function() playerEvent(source,'join') end)
AddEventHandler('playerDropped',function() playerEvent(source,'leave') end)
CreateThread(function() while true do Wait(heartbeatSeconds*1000);local players=GetPlayers();if #players>0 then clockSequence=clockSequence+1;clockSample={player=tonumber(players[1]),token=clockSequence,expires=GetGameTimer()+10000};TriggerClientEvent('communityhub:sampleClock',clockSample.player,clockSample.token) end;request('POST','/heartbeat',{server_key=Config.ServerKey,hostname=Config.ServerName,players=#GetPlayers(),max_players=Config.MaxPlayers});for _,id in ipairs(GetPlayers()) do local src=tonumber(id);local lic=licenseFor(src);if lic then local duty='available';if QBCore then local p=QBCore.Functions.GetPlayer(src);if p and p.PlayerData.job then duty=p.PlayerData.job.onduty and 'on_duty' or 'off_duty' end end;local x,y,z=unitPosition(src);request('POST','/active-unit',{position_x=x,position_y=y,position_z=z,server_key=Config.ServerKey,license=lic,player_name=GetPlayerName(src),duty_status=duty}) end end end end)
RegisterNetEvent('communityhub:getProfile',function() local src=source;local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:profile',src,{ok=false,error='No FiveM license found'}) end;request('GET','/player/'..lic,nil,function(_,body) if licenseFor(src)~=lic then return end;TriggerClientEvent('communityhub:profile',src,body) end);request('POST','/patrol/history',{license=lic},function(_,body) if licenseFor(src)~=lic then return end;TriggerClientEvent('communityhub:clockHistory',src,body) end);request('GET','/tablet?license='..lic,nil,function(_,body) if licenseFor(src)~=lic then return end;TriggerClientEvent('communityhub:tabletData',src,body) end) end)
RegisterNetEvent('communityhub:link',function(code) local src=source;local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:linkResult',src,{ok=false,error='No FiveM license found'}) end;if lic then request('POST','/link',{code=tostring(code),license=lic,player_name=GetPlayerName(src)},function(_,body) if licenseFor(src)~=lic then return end;TriggerClientEvent('communityhub:linkResult',src,body) end) end end)
RegisterNetEvent('communityhub:clockIn',function() local src=source;local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:patrolResult',src,{ok=false,error='No FiveM license found'}) end;if lic then request('POST','/patrol/clock-in',{license=lic,server_key=Config.ServerKey},function(_,body) if licenseFor(src)~=lic then return end;TriggerClientEvent('communityhub:patrolResult',src,body) end) end end)
RegisterNetEvent('communityhub:clockOut',function() local src=source;local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:patrolResult',src,{ok=false,error='No FiveM license found'}) end;if lic then request('POST','/patrol/clock-out',{license=lic,server_key=Config.ServerKey},function(_,body) if licenseFor(src)~=lic then return end;TriggerClientEvent('communityhub:patrolResult',src,body) end) end end)
RegisterNetEvent('communityhub:report',function(data) local src=source;local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:reportResult',src,{ok=false,error='No FiveM license found'}) end;if lic then local x,y=unitPosition(src);request('POST','/report',{position_x=x,position_y=y,license=lic,server_key=Config.ServerKey,report_type=data.report_type,reported_name=data.reported_name,subject=data.subject,details=data.details},function(_,body) if licenseFor(src)~=lic then return end;TriggerClientEvent('communityhub:reportResult',src,body) end) end end)
RegisterCommand('link',function(src,args) if src>0 then if args[1] then TriggerEvent('communityhub:serverLink',src,args[1]) else TriggerClientEvent('communityhub:linkResult',src,{ok=false,error='Use /link <6-digit code> from the website FiveM page; this is not your player ID.'}) end end end,false)
AddEventHandler('communityhub:serverLink',function(src,code) local lic=licenseFor(src);if not lic then return TriggerClientEvent('communityhub:linkResult',src,{ok=false,error='No FiveM license found'}) end;if lic then request('POST','/link',{code=tostring(code),license=lic,player_name=GetPlayerName(src)},function(_,body) if licenseFor(src)~=lic then return end;TriggerClientEvent('communityhub:linkResult',src,body) end) end end)
-- Run from the server console; credentials remain server-side.
RegisterCommand('communityhub_test',function(src)
    if src ~= 0 then return end
    request('GET','/status/'..Config.ServerKey,nil,function(_,body)
        if body.ok then print('[Community Hub] API connection, authentication and server configuration OK.') end
    end)
end,true)

RegisterNetEvent('communityhub:clockSample',function(token,hours,minutes)
    local src=source
    if not clockSample or src~=clockSample.player or token~=clockSample.token or GetGameTimer()>clockSample.expires then return end
    clockSample=nil
    if type(hours)~='number' or hours%1~=0 or hours<0 or hours>23 or type(minutes)~='number' or minutes%1~=0 or minutes<0 or minutes>59 then return end
    request('POST','/game-time',{server_key=Config.ServerKey,hours=hours,minutes=minutes})
end)
local chatReads={}
AddEventHandler('playerDropped',function() chatReads[source]=nil end)
RegisterNetEvent('communityhub:adminChat',function(message)
    local src=source
    local lic=licenseFor(src)
    if not lic then return TriggerClientEvent('communityhub:chatData',src,{ok=false,error='Link your account first.'}) end
    if message==nil then
        local now=GetGameTimer()
        if chatReads[src] and now-chatReads[src]<2000 then return end
        chatReads[src]=now
    elseif type(message)~='string' or #message>4000 then return end
    request('POST',message==nil and '/admin-chat/read' or '/admin-chat/send',{license=lic,server_key=Config.ServerKey,message=message},function(_,body)
        if licenseFor(src)~=lic then return end
        -- Never broadcast chat to all players. SQL checks the linked role on every request.
        body.wasSend=message~=nil
        body.sent=message~=nil and body.ok or false
        TriggerClientEvent('communityhub:chatData',src,body)
    end)
end)

-- Server-owned player identity and coordinates; clients cannot choose a license or server.
local featureBudget={}
AddEventHandler('playerDropped',function() featureBudget[source]=nil end)
RegisterNetEvent('communityhub:feature',function(kind,requestId,data)
    local src=source;local lic=licenseFor(src)
    if not lic or type(requestId)~='string' or #requestId<16 or #requestId>64 or not requestId:match('^[%w_-]+$') or type(data)~='table' then return end
    local routes={lmsRead='/lms/summary',appCatalog='/applications/catalog',appForm='/applications/form',appSubmit='/applications/submit',reportsRead='/reports/read',reportsAction='/reports/update',newsRead='/community/news/read',newsPost='/community/news/read-post',rulesRead='/community/rules/read',ticketsRead='/support/tickets/read',ticketCreate='/support/tickets/create',ticketReply='/support/tickets/reply'}
    if not routes[kind] then return end
    local now=GetGameTimer();local budget=featureBudget[src]
    if not budget or now-budget.start>=60000 then budget={start=now,count=0};featureBudget[src]=budget end
    budget.count=budget.count+1
    if budget.count>60 then return TriggerClientEvent('communityhub:featureReply',src,requestId,{ok=false,error='Too many requests. Please wait a minute.'}) end
    data.license=lic;data.server_key=Config.ServerKey
    request('POST',routes[kind],data,function(_,body)
        if licenseFor(src)~=lic then return end
        TriggerClientEvent('communityhub:featureReply',src,requestId,body)
    end)
end)

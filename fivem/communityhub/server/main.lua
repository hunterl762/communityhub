local function licenseFor(src)
  for _,id in ipairs(GetPlayerIdentifiers(src)) do if string.sub(id,1,8)=='license:' then return id end end
end
local function request(method,path,data,cb)
  PerformHttpRequest(Config.ApiBase..path,function(status,body)
    local parsed={}; if body and body~='' then parsed=json.decode(body) or {} end
    if cb then cb(status,parsed) end
  end,method,data and json.encode(data) or '',{['Content-Type']='application/json',['x-communityhub-key']=Config.ApiKey})
end
CreateThread(function()
  while true do
    Wait(Config.HeartbeatSeconds*1000)
    request('POST','/heartbeat',{server_key=Config.ServerKey,hostname=Config.ServerName,players=#GetPlayers(),max_players=Config.MaxPlayers})
  end
end)
RegisterNetEvent('communityhub:getProfile',function()
  local src=source; local lic=licenseFor(src); if not lic then return TriggerClientEvent('communityhub:profile',src,{ok=false,error='No FiveM license found'}) end
  request('GET','/player/'..lic,nil,function(_,body) TriggerClientEvent('communityhub:profile',src,body) end)
end)
RegisterNetEvent('communityhub:link',function(code)
  local src=source; local lic=licenseFor(src); if not lic then return end
  request('POST','/link',{code=tostring(code),license=lic,player_name=GetPlayerName(src)},function(_,body) TriggerClientEvent('communityhub:linkResult',src,body) end)
end)
RegisterNetEvent('communityhub:clockIn',function()
  local src=source; local lic=licenseFor(src); if lic then request('POST','/patrol/clock-in',{license=lic,server_key=Config.ServerKey},function(_,body) TriggerClientEvent('communityhub:patrolResult',src,body) end) end
end)
RegisterNetEvent('communityhub:clockOut',function()
  local src=source; local lic=licenseFor(src); if lic then request('POST','/patrol/clock-out',{license=lic},function(_,body) TriggerClientEvent('communityhub:patrolResult',src,body) end) end
end)
RegisterCommand('link',function(src,args) if src>0 and args[1] then TriggerEvent('communityhub:serverLink',src,args[1]) end end,false)
AddEventHandler('communityhub:serverLink',function(src,code) local lic=licenseFor(src);if lic then request('POST','/link',{code=tostring(code),license=lic,player_name=GetPlayerName(src)},function(_,body) TriggerClientEvent('communityhub:linkResult',src,body) end) end end)
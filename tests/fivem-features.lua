Config={Framework='standalone',ServerKey='fixture',HeartbeatSeconds=30};local handlers={};local calls={};local replies={};local currentLicense='license:fixture';source=1
function GetPlayerIdentifiers() return {currentLicense} end
function GetPlayerPed() return 99 end
function GetEntityCoords() return {x=123,y=456,z=78} end
function GetGameTimer() return 1000 end
function GetPlayerName() return 'Fixture' end
function GetPlayers() return {} end
function CreateThread() end
function RegisterCommand() end
function AddEventHandler() end
function RegisterNetEvent(name,handler) handlers[name]=handler end
function TriggerClientEvent(name,src,id,body) replies[#replies+1]={name=name,src=src,id=id,body=body} end
CommunityHubHttp={request=function(method,route,data,cb) calls[#calls+1]={method=method,route=route,data=data,cb=cb} end}
-- The runner loads server/main.lua here.
function testFeatures()
 local feature=handlers['communityhub:feature'];assert(feature,'Missing feature bridge')
 feature('opsAction','abcdefghijklmnop',{action='panic',license='license:other',server_key='other',position_x=9999,position_y=9999})
 assert(#calls==1);assert(calls[1].data.license=='license:fixture');assert(calls[1].data.server_key=='fixture');assert(calls[1].data.position_x==123 and calls[1].data.position_y==456)
 calls[1].cb(200,{ok=true});assert(#replies==1 and replies[1].src==1)
 feature('appCatalog','abcdefghijklmnop',{});currentLicense='license:newplayer';calls[2].cb(200,{ok=true,private=true});assert(#replies==1,'Late response leaked to a replacement player')
 local count=#calls;feature('notAllowed','abcdefghijklmnop',{});feature('opsState','short',{});assert(#calls==count)
 for i=1,65 do feature('opsState','abcdefghijklmnop',{}) end
 assert(replies[#replies].body.ok==false,'Missing per-player request budget')
 print('Passed: server-owned identity/server/GPS, targeted responses, disconnect isolation, route allowlist, request validation and resource rate budget.')
end

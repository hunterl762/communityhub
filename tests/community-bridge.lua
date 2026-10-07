Config={Framework='standalone',ServerKey='fixture',HeartbeatSeconds=30}
local handlers,calls,replies={},{},{}
local currentLicense='license:real'
source=1
function GetPlayerIdentifiers() return {currentLicense} end
function GetGameTimer() return 1000 end
function CreateThread() end
function RegisterCommand() end
function AddEventHandler() end
function RegisterNetEvent(name,fn) handlers[name]=fn end
function TriggerClientEvent(name,src,id,body) replies[#replies+1]={name=name,src=src,id=id,body=body} end
CommunityHubHttp={request=function(method,route,data,cb) calls[#calls+1]={method=method,route=route,data=data,cb=cb} end}
dofile('fivem/communityhub/server/main.lua')
local feature=handlers['communityhub:feature']
local routes={lmsRead='/lms/summary',newsRead='/community/news/read',newsPost='/community/news/read-post',rulesRead='/community/rules/read',ticketsRead='/support/tickets/read',ticketCreate='/support/tickets/create',ticketReply='/support/tickets/reply'}
for kind,route in pairs(routes) do
 feature(kind,'abcdefghijklmnop',{license='license:forged',server_key='wrong',ticket_id=1})
 local call=calls[#calls];assert(call.method=='POST' and call.route==route)
 assert(call.data.license=='license:real' and call.data.server_key=='fixture')
 call.cb(200,{ok=true});assert(replies[#replies].src==1)
end
local n=#calls
feature('notAllowed','abcdefghijklmnop',{});feature('ticketCreate','short',{})
assert(#calls==n)
feature('ticketsRead','abcdefghijklmnop',{});currentLicense='license:replacement';local count=#replies;calls[#calls].cb(200,{ok=true,private=true});assert(#replies==count)
for i=1,65 do feature('newsRead','abcdefghijklmnop',{}) end
assert(replies[#replies].body.ok==false)
print('Community bridge identity, routes, targeted replies, disconnect isolation and request budget passed.')

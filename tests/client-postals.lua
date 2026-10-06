Config={Postals={Provider='builtin'}}
local state='started'
local result='902'
local broken=false
function LoadResourceFile() return 'fixture' end
function GetCurrentResourceName() return 'communityhub' end
json={decode=function() return {{code='101',x=0,y=0},{code='202',x=100,y=100}} end}
function GetResourceState() return state end
exports={['nearest-postal']={getPostal=function() if broken then error('missing export') end return result end}}
dofile('fivem/communityhub/client/postals.lua')
assert(CommunityHubPostals.current(0,0)=='101')
Config.Postals.Provider='nearest-postal'
assert(CommunityHubPostals.current(0,0)=='902')
assert(CommunityHubPostals.status().source=='nearest-postal')
Config.Postals.Provider='auto';assert(CommunityHubPostals.current(0,0)=='902')
result={code=' 903 '};assert(CommunityHubPostals.current(0,0)=='903')
result=904;assert(CommunityHubPostals.current(0,0)=='904')
state='stopped';assert(CommunityHubPostals.current(100,100)=='202')
assert(CommunityHubPostals.status().source=='builtin' and CommunityHubPostals.status().reason:find('stopped'))
Config.Postals.Fallback=false;assert(CommunityHubPostals.current(100,100)==nil)
state='started';broken=true;assert(CommunityHubPostals.current(0,0)==nil)
broken=false;result='<script>';assert(CommunityHubPostals.current(0,0)==nil)
Config.Postals.Provider='disabled';assert(CommunityHubPostals.current(0,0)==nil)
print('Passed: external postal export, returned strings/tables/numbers, stopped resource, failed export, fallback and disabled mode.')

Config={LBPhone={Enabled=true,Resource='lb-phone',Identifier='communityhub',Name='Hub',DefaultApp=true}}
local callbacks,handlers,threads,normal,messages,server={}, {}, {}, {}, {}, {}
local app
exports=setmetatable({}, {__index=function() return {AddCustomApp=function(_,value) app=value;return true end,SendCustomAppMessage=function(_,id,data) messages[#messages+1]=data;return true end,RemoveCustomApp=function() app=nil end} end})
GetResourceState=function() return 'started' end
GetCurrentResourceName=function() return 'communityhub' end
SendNUIMessage=function() error('Standalone NUI is forbidden') end
RegisterNUICallback=function(name,fn) callbacks[name]=fn end
AddEventHandler=function(name,fn) handlers[name]=fn end
CreateThread=function(fn) threads[#threads+1]=fn end
Wait=function() end
TriggerServerEvent=function(name) server[#server+1]=name end
dofile('fivem/communityhub/client/phone.lua')
threads[1]()
assert(app.identifier=='communityhub' and app.ui=='communityhub/html/phone.html')
CommunityHubSendUI({type='profile',data={ok=true,player={id=1}}})
assert(#messages==0,'Closed phone should not receive data')
app.onOpen()
local ready
callbacks.phoneReady({},function(value) ready=value end)
assert(ready.ok and messages[#messages].type=='profile','Phone must replay loaded state after ready')
local before=#messages
CommunityHubSendUI({type='appearance',theme='dark'})
CommunityHubSendUI({type='visible',visible=false})
assert(#messages==before,'Tablet visibility/theme must not overwrite the phone')
CommunityHubSendUI({type='featureReply',request_id='fixture',data={ok=true}})
assert(messages[#messages].request_id=='fixture')
app.onClose()
assert(messages[#messages].type=='visible' and messages[#messages].visible==false)
before=#messages
CommunityHubSendUI({type='clockHistory',data={ok=true}})
assert(#messages==before,'Closed phone must not receive background updates')
handlers.onClientResourceStop('lb-phone')
handlers.onClientResourceStart('lb-phone')
threads[#threads]()
assert(app)
handlers.onClientResourceStop('communityhub')
assert(app==nil)
RegisterNetEvent=function(name,fn) handlers[name]=fn end
RegisterCommand=function() error('Commands are forbidden') end
RegisterKeyMapping=function() error('Key mappings are forbidden') end
SetNuiFocus=function() error('Phone owns focus') end
dofile('fivem/communityhub/client/main.lua')
callbacks.link({code='123456'},function(value) assert(value.ok) end)
assert(server[#server]=='communityhub:link')
assert(callbacks.hudToggle==nil and callbacks.open==nil and callbacks.ready==nil)
assert(not CommunityHubPhoneIsOpen())
io.write('Passed LB Phone registration, readiness replay, theme/focus isolation, callbacks, close and restart cleanup.\n')

-- Standalone Lua regression test; no FiveM server or real API key required.
Config = {ApiBase='http://localhost:3020/api/fivem/',ApiKey='test-only-key'}
local status, response, captured, callback, calls = 200, 'success', nil, nil, 0
local logs = {}
print = function(message) logs[#logs+1] = message end
json = {
    encode = function() return '{}' end,
    decode = function(body)
        if body == 'success' then return {ok=true,player={id=1}} end
        if body == 'expired' then return {ok=false,error='Link code expired or invalid'} end
        if body == 'schema' then return {ok=false,error='Apply migrations 005 and 006'} end
        if body == 'array' then return {} end
        if body == 'scalar' then return 'not an object' end
        error('invalid JSON')
    end
}
PerformHttpRequest = function(url,cb,method,data,headers,options)
    calls = calls + 1
    captured = {url=url,method=method,headers=headers,options=options}
    cb(status,response)
end
dofile('fivem/communityhub/server/http.lua')
local function run(code,body,expected)
    status,response = code,body
    callback = nil
    CommunityHubHttp.request('POST','/link',{code='123456'},function(_,result) callback=result end)
    assert(callback ~= nil,'request callback was lost')
    if expected then
        assert(callback.ok==false,'failure treated as success')
        assert(callback.error:find(expected,1,true),'missing actionable error: '..callback.error)
    else assert(callback.ok==true,'successful request failed') end
end
run(200,'success')
assert(captured.url=='http://localhost:3020/api/fivem/link','trailing slash not normalized')
assert(captured.headers['x-communityhub-key']=='test-only-key')
assert(captured.options.followLocation==false,'credentials must not follow redirects')
run(0,nil,'Cannot reach')
run(-1,'','Cannot reach')
run(401,'<html>','authentication')
run(403,'<html>','authentication')
run(302,'<html>','redirects')
run(429,'text','request limit')
run(404,'<html>','endpoint not found')
run(404,'expired','Link code expired')
run(503,'schema','migrations')
run(500,'<html>','server error')
run(200,'<html>','JSON response')
run(200,'array','JSON response')
run(200,'scalar','JSON response')
run(204,'','JSON response')
run(400,'<html>','HTTP 400')
Config.ApiKey = 'CHANGE_ME'
local before = calls
run(200,'success','Config.ApiKey')
assert(calls==before,'invalid config performed an HTTP request')
Config.ApiKey='test-only-key'
Config.ApiBase='http://localhost:3020'
run(200,'success','must end in /api/fivem')
Config.ApiBase='[http://example.test:3020/api/fivem](http://example.test:3020/api/fivem)'
before=calls
run(200,'success','reachable website URL')
assert(calls==before,'Markdown URL performed an HTTP request')
for _,message in ipairs(logs) do assert(not message:find('test-only-key',1,true),'secret was logged') end
io.write('Passed: Lua HTTP success, network/auth/redirect/rate-limit/API errors, malformed JSON, config validation, URL normalization and credential-safe logs.\n')

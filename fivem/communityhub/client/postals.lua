CommunityHubPostals={}
local rows={}
local mapFile=(Config.Postals or {}).Provider=='ocrp' and 'html/data/ocrp-postals.json' or 'html/data/postals.json'
local raw=LoadResourceFile(GetCurrentResourceName(),mapFile)
if raw then local ok,data=pcall(json.decode,raw);if ok and type(data)=='table' then for _,p in ipairs(data) do if type(p.code)=='string' and #p.code<=16 and type(p.x)=='number' and type(p.y)=='number' then rows[#rows+1]=p end end end end
function CommunityHubPostals.nearest(x,y)
    if type(x)~='number' or type(y)~='number' or x~=x or y~=y or math.abs(x)>20000 or math.abs(y)>20000 then return nil end
    local best=nil;local distance=math.huge
    for _,p in ipairs(rows) do local d=(p.x-x)^2+(p.y-y)^2;if d<distance then best=p;distance=d end end
    return best and best.code or nil
end
local lastStatus = {source='unavailable', reason='Waiting for the first postal update.'}
function CommunityHubPostals.status() return lastStatus end
function CommunityHubPostals.current(x,y)
    local settings = Config.Postals or {}
    local provider = settings.Provider or 'auto'
    local function result(code,source,reason)
        lastStatus={code=code,source=source,reason=reason,resource=settings.Resource or 'nearest-postal'}
        return code
    end
    if provider == 'disabled' then return result(nil,'disabled','Postal display is disabled in client/config.lua.') end
    if provider ~= 'auto' and provider ~= 'nearest-postal' and provider ~= 'builtin' and provider ~= 'ocrp' then
        return result(nil,'unavailable','Invalid postal Provider in client/config.lua.')
    end
    local reason
    if provider == 'nearest-postal' or provider == 'auto' then
        local resource = settings.Resource or 'nearest-postal'
        local exportName = settings.Export or 'getPostal'
        local state = GetResourceState(resource)
        if state == 'started' then
            local ok, code = pcall(function() local api=exports[resource]; return api[exportName](api) end)
            if ok then
                if type(code) == 'table' then code = code.code end
                if type(code) == 'string' or type(code) == 'number' then
                    code = tostring(code):gsub('^%s+', ''):gsub('%s+$', '')
                    if #code > 0 and #code <= 16 and code:match('^[%w_-]+$') then return result(code,'nearest-postal') end
                end
            end
            reason=ok and (resource..' has not returned a valid postal yet.') or (resource..' export '..exportName..' failed. Check the resource version and export name.')
        else
            reason=resource..' is '..tostring(state)..'. Check its folder name and ensure it before communityhub.'
        end
        if settings.Fallback == false then return result(nil,'unavailable',reason) end
    end
    return result(CommunityHubPostals.nearest(x,y),provider=='ocrp' and 'ocrp' or 'builtin',reason)
end

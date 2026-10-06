CommunityHubPostals={}
local rows={}
local raw=LoadResourceFile(GetCurrentResourceName(),'html/data/postals.json')
if raw then local ok,data=pcall(json.decode,raw);if ok and type(data)=='table' then for _,p in ipairs(data) do if type(p.code)=='string' and #p.code<=16 and type(p.x)=='number' and type(p.y)=='number' then rows[#rows+1]=p end end end end
function CommunityHubPostals.nearest(x,y)
    if type(x)~='number' or type(y)~='number' or x~=x or y~=y or math.abs(x)>20000 or math.abs(y)>20000 then return nil end
    local best=nil;local distance=math.huge
    for _,p in ipairs(rows) do local d=(p.x-x)^2+(p.y-y)^2;if d<distance then best=p;distance=d end end
    return best and best.code or nil
end
function CommunityHubPostals.current(x,y)
    local settings = Config.Postals or {}
    local provider = settings.Provider or 'builtin'
    if provider == 'disabled' then return nil end
    if provider == 'nearest-postal' then
        local resource = settings.Resource or 'nearest-postal'
        local exportName = settings.Export or 'getPostal'
        if GetResourceState(resource) == 'started' then
            local ok, code = pcall(function() local api=exports[resource]; return api[exportName](api) end)
            if ok then
                if type(code) == 'table' then code = code.code end
                if type(code) == 'string' or type(code) == 'number' then
                    code = tostring(code):gsub('^%s+', ''):gsub('%s+$', '')
                    if #code > 0 and #code <= 16 and code:match('^[%w_-]+$') then return code end
                end
            end
        end
        if settings.Fallback == false then return nil end
    end
    return CommunityHubPostals.nearest(x,y)
end

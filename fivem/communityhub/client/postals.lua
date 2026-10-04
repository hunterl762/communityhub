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

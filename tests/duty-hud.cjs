const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const nodes=new Map(),listeners=[],intervals=[];let now=0,ready,requests=[];
function node(id){if(!nodes.has(id)){const classes=new Set(['miniHud','applications','applicationForm'].includes(id)?['hidden']:[]);nodes.set(id,{textContent:'',value:'',dataset:{},classList:{toggle(c,on){on?classes.add(c):classes.delete(c)},contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c)},replaceChildren(){},addEventListener(){},click(){}});}return nodes.get(id);}
const document={getElementById:node,querySelectorAll:()=>[],documentElement:{dataset:{}},addEventListener(name,fn){if(name==='DOMContentLoaded')ready=fn;}};
const context=vm.createContext({document,window:{addEventListener:(name,fn)=>listeners.push(fn)},Date:class extends Date{static now(){return now}},Map,Set,console,setInterval:fn=>intervals.push(fn),setTimeout(){},clearTimeout(){},send:async action=>{requests.push(action);return true},showNotice:message=>node('notice').textContent=message});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../fivem/communityhub/html/tablet-features.js'),'utf8'),context);
const message=data=>listeners.forEach(fn=>fn({data}));
ready();assert(requests.includes('ready'));
message({type:'clockHistory',data:{ok:true,active:{id:1,duration_seconds:3599},sessions:[]}});
message({type:'profile',data:{ok:true,player:{id:1,can_use_hud:true,callsign:'101',display_name:'Member',department_name:'Patrol'}}});
message({type:'tabletData',data:{branding:{name:'CommunityHub',features:{hud:true,applications:false}}}});
assert(!node('miniHud').classList.contains('hidden'));assert.equal(node('dutyElapsed').textContent,'00:59:59');
now=1000;intervals.forEach(fn=>fn());assert.equal(node('dutyElapsed').textContent,'01:00:00');assert(node('hudDuty').textContent.includes('01:00:00'));
message({type:'visible',visible:true});assert(node('miniHud').classList.contains('hidden'));
message({type:'hud',enabled:true});assert(node('notice').textContent.includes('Close the tablet'));
message({type:'visible',visible:false});assert(!node('miniHud').classList.contains('hidden'));
message({type:'hud',enabled:false});assert(node('miniHud').classList.contains('hidden'));
message({type:'hud',enabled:true});message({type:'tabletData',data:{branding:{name:'CommunityHub',features:{hud:false}}}});assert(node('miniHud').classList.contains('hidden'));
message({type:'tabletData',data:{branding:{name:'CommunityHub',features:{hud:true}}}});
message({type:'profile',data:{ok:true,player:{id:1,can_use_hud:false}}});assert(node('miniHud').classList.contains('hidden'));
message({type:'profile',data:{ok:true,player:{id:1,can_use_hud:true}}});
message({type:'clockHistory',data:{ok:true,active:null,sessions:[]}});intervals.forEach(fn=>fn());assert(node('miniHud').classList.contains('hidden'));assert.equal(node('dutyElapsed').textContent,'00:00:00');
// Dashboard timers tick active sessions and keep completed sessions fixed.
let mutation;const webNodes=[{dataset:{dutySeconds:'3661',dutyRunning:'true'},style:{},textContent:''},{dataset:{dutySeconds:'18000',dutyRunning:'false'},style:{},textContent:''}];let webTick;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/js/duty-timer.js'),'utf8'),{document:{querySelectorAll:()=>webNodes,getElementById:()=>({}),addEventListener(){}},Date:{now:()=>now},WeakMap,MutationObserver:class{constructor(fn){mutation=fn}observe(){}},setInterval:fn=>webTick=fn});
assert.equal(webNodes[0].textContent,'01:01:01');now+=2000;webTick();assert.equal(webNodes[0].textContent,'01:01:03');assert.equal(webNodes[1].textContent,'05:00:00');
webNodes.push({dataset:{dutySeconds:'0',dutyRunning:'true'},style:{},textContent:''});mutation();assert.equal(webNodes[2].textContent,'00:00:00');
console.log('Passed: NUI readiness, out-of-order duty/profile, HUD permissions/toggle/clock-out, hour rollover, dashboard active/completed clocks and refreshed rows.');

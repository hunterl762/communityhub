function validate(body,creating=false){
 const text=(key,max,required=false)=>{const value=String(body[key]??'').trim();if((required&&!value)||value.length>max)throw Object.assign(new Error('Check '+key.replaceAll('_',' ')+'.'),{status:400});return value||null;};
 const config={name:text('name',120,true),hostname:text('hostname',255),connect_url:text('connect_url',255),restart_schedule:text('restart_schedule',255),framework:body.framework,max_players:Number(body.max_players),is_enabled:body.is_enabled?1:0};
 if(!['standalone','qbcore'].includes(config.framework))throw Object.assign(new Error('Select a supported framework.'),{status:400});
 if(!Number.isInteger(config.max_players)||config.max_players<1||config.max_players>2048)throw Object.assign(new Error('Maximum players must be between 1 and 2048.'),{status:400});
 if(config.connect_url&&!/^(fivem:\/\/connect\/|https:\/\/cfx\.re\/join\/)[^\s]+$/i.test(config.connect_url))throw Object.assign(new Error('Use a FiveM connect URL or an https://cfx.re/join/ link.'),{status:400});
 if(creating){config.server_key=text('server_key',80,true);if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(config.server_key))throw Object.assign(new Error('Server key must use letters, numbers, underscores or hyphens.'),{status:400});}return config;
}module.exports={validate};

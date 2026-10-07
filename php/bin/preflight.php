<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/src/Core.php';
use CommunityHub\App;
App::boot();$failed=false;
function check(string $label,bool $ok):void{global $failed;echo ($ok?'PASS ':'FAIL ').$label.PHP_EOL;if(!$ok)$failed=true;}
check('PHP 8.2 or newer',PHP_VERSION_ID>=80200);
foreach(['pdo_mysql','curl','mbstring','fileinfo','openssl'] as $extension)check('PHP extension '.$extension,extension_loaded($extension));
check('Composer dependencies included',is_file(dirname(__DIR__).'/vendor/autoload.php'));
check('Public base URL uses HTTPS',str_starts_with(App::base(),'https://'));
check('Discord callback matches this domain',App::env('DISCORD_CALLBACK_URL')===App::base('/auth/discord/callback'));
foreach(['DISCORD_CLIENT_ID','DISCORD_CLIENT_SECRET','DISCORD_GUILD_ID','DISCORD_BOT_TOKEN'] as $name)check($name.' configured',App::env($name)!==''&&App::env($name)!=='replace_this');
try{App::query('SELECT 1');check('Database connection',true);foreach(['users','site_settings','php_sessions','php_rate_limits','fivem_api_keys','fivem_servers','reports','fivem_reports','lms_assessment_attempts','lms_quiz_answers','document_contents','automation_runs'] as $table){try{App::query('SELECT 1 FROM `'.$table.'` LIMIT 1');check('Database table '.$table,true);}catch(Throwable $e){check('Database table '.$table,false);}}foreach([['users','bio'],['reports','reported_name'],['applications','submission_key']] as [$table,$column])check($table.'.'.$column.' present',(bool)App::row('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?',[$table,$column]));}catch(Throwable $e){check('Database connection',false);}
echo $failed?'Fix failed checks before switching FiveM to this site.'.PHP_EOL:'Preflight passed. Verify Discord sign-in and a linked FiveM server before cutover.'.PHP_EOL;
exit($failed?1:0);

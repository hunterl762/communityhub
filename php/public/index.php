<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/src/Core.php';
if(is_file(dirname(__DIR__).'/vendor/autoload.php'))require_once dirname(__DIR__).'/vendor/autoload.php';
spl_autoload_register(function(string $class):void{if(str_starts_with($class,'CommunityHub\\')){$name=substr($class,13);if(preg_match('/^[A-Za-z]+$/',$name)&&is_file($file=dirname(__DIR__).'/src/'.$name.'.php'))require $file;}});
use CommunityHub\App;
use CommunityHub\Auth;
use CommunityHub\FiveM;
use CommunityHub\HttpError;
App::boot();
header('X-Content-Type-Options: nosniff');header('Referrer-Policy: same-origin');header('X-Frame-Options: SAMEORIGIN');
$path=rawurldecode(parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH)??'/');$method=$_SERVER['REQUEST_METHOD']??'GET';
$path=$path==='/'?'/':rtrim($path,'/');if($method==='HEAD')$method='GET';
$api=$path==='/api/fivem'||str_starts_with($path,'/api/fivem/');
try {
 if($api){$raw=file_get_contents('php://input');if(strlen($raw)>1048576)throw new HttpError('Request too large.',413);$body=$raw!==''?json_decode($raw,true,64,JSON_THROW_ON_ERROR):[];if(!is_array($body)||($body&&array_is_list($body)))throw new HttpError('Submit a JSON object.');$data=array_replace($_GET,$body);$route=substr($path,10)?:'/';FiveM::authenticate($data,$route,(string)($_SERVER['HTTP_X_COMMUNITYHUB_KEY']??''));App::json(FiveM::handle($method,$route,$data));}
 if($path==='/health'){App::query('SELECT 1');App::json(['ok'=>true]);}
 ob_start();Auth::start();\CommunityHub\Web::handle($method,$path,$_POST);
}catch(\JsonException $e){App::json(['ok'=>false,'error'=>'Invalid JSON request.'],400);}
catch(HttpError $e){if(ob_get_level())ob_clean();if($api)App::json(['ok'=>false,'error'=>$e->getMessage()],$e->status);http_response_code($e->status);\CommunityHub\View::message('CommunityHub',$e->getMessage());}
catch(\Throwable $e){if(ob_get_level())ob_clean();error_log('[CommunityHub PHP] '.get_class($e).' '.basename($e->getFile()).':'.$e->getLine().' '.($e instanceof \PDOException?($e->errorInfo[1]??'database error'):'request failed'));if($api)App::json(['ok'=>false,'error'=>'Community Hub server error. Check database configuration and migrations.'],500);http_response_code(500);echo 'Community Hub is temporarily unavailable. Please try again shortly.';}

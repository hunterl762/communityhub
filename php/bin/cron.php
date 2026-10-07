<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(403);exit;}
require dirname(__DIR__).'/src/Core.php';
spl_autoload_register(function(string $class):void{if(str_starts_with($class,'CommunityHub\\')){$file=dirname(__DIR__).'/src/'.substr($class,13).'.php';if(is_file($file))require $file;}});
\CommunityHub\App::boot();
try{echo json_encode(\CommunityHub\Jobs::run(),JSON_THROW_ON_ERROR).PHP_EOL;}catch(\Throwable $e){fwrite(STDERR,'CommunityHub scheduled job failed. Check database settings and migrations.'.PHP_EOL);exit(1);}

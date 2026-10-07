<?php
// Test process only: configured with PHP's auto_prepend_file, never loaded by the app.
require_once dirname(__DIR__).'/src/Core.php';
\CommunityHub\App::boot();
if(\CommunityHub\App::env('APP_ENV')!=='testing')throw new \RuntimeException('Test transport is restricted to the test environment.');
\CommunityHub\App::$discordTransport=static function(string $method,string $path,?array $body,?string $authorization):array {
 if(preg_match('~members/(\d+)$~',$path,$m)&&$m[1]==='999')throw new \CommunityHub\HttpError('Join the community Discord to access this section.',403);
 return ['roles'=>[]];
};

<?php
// Development server only. cPanel Apache uses public/.htaccess.
$path=rawurldecode(parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH)??'/');
if(preg_match('~^/(css|js|images|data)/~',$path)&&!str_contains($path,"\0")){
 foreach([__DIR__.'/public',dirname(__DIR__).'/public'] as $root){$base=realpath($root);$file=realpath($root.$path);if($base&&$file&&str_starts_with($file,$base.DIRECTORY_SEPARATOR)&&is_file($file)&&!preg_match('/\.(php|env|sql)$/i',$file)){$ext=strtolower(pathinfo($file,PATHINFO_EXTENSION));$types=['css'=>'text/css','js'=>'application/javascript','json'=>'application/json','png'=>'image/png','jpg'=>'image/jpeg','jpeg'=>'image/jpeg','svg'=>'image/svg+xml','webp'=>'image/webp'];header('Content-Type: '.($types[$ext]??'application/octet-stream'));readfile($file);return;}}
}
require __DIR__.'/public/index.php';

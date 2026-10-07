<?php
declare(strict_types=1);
namespace CommunityHub;

final class HttpError extends \RuntimeException { public function __construct(string $message,public int $status=400){parent::__construct($message);} }
final class App {
    public static array $config=[];
    private static ?\PDO $connection=null;
    public static ?\Closure $discordTransport=null;
    public static function boot():void {
        $file=getenv('COMMUNITYHUB_ENV')?:dirname(__DIR__).'/.env';
        if(is_file($file))foreach(file($file,FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES) as $line){if(preg_match('/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/',$line,$m)){$value=trim($m[2]);if(strlen($value)>=2&&(($value[0]==='"'&&str_ends_with($value,'"'))||($value[0]==="'"&&str_ends_with($value,"'")))){$value=substr($value,1,-1);}else{$value=preg_replace('/\s+#.*$/','',$value);}self::$config[$m[1]]=$value;}}
        date_default_timezone_set(self::env('APP_TIMEZONE','America/New_York'));
    }
    public static function env(string $key,string $default=''):string{return (string)(getenv($key)!==false?getenv($key):(self::$config[$key]??$default));}
    public static function db():\PDO {
        if(!self::$connection){self::$connection=new \PDO('mysql:host='.self::env('DB_HOST','127.0.0.1').';port='.self::env('DB_PORT','3306').';dbname='.self::env('DB_NAME','communityhub').';charset=utf8mb4',self::env('DB_USER'),self::env('DB_PASSWORD'),[\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION,\PDO::ATTR_DEFAULT_FETCH_MODE=>\PDO::FETCH_ASSOC,\PDO::ATTR_EMULATE_PREPARES=>false]);
        self::$connection->prepare('SET time_zone = ?')->execute([date('P')]);}return self::$connection;
    }
    public static function query(string $sql,array $params=[]):\PDOStatement {$q=self::db()->prepare($sql);$q->execute($params);return $q;}
    public static function rows(string $sql,array $params=[]):array{return self::query($sql,$params)->fetchAll();}
    public static function row(string $sql,array $params=[]):?array{return self::query($sql,$params)->fetch()?:null;}
    public static function insert(string $sql,array $params=[]):int{self::query($sql,$params);return (int)self::db()->lastInsertId();}
    public static function transaction(callable $fn):mixed{$db=self::db();$db->beginTransaction();try{$result=$fn();$db->commit();return $result;}catch(\Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}}
    public static function json(array $data,int $status=200):never{http_response_code($status);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');echo json_encode(self::dates($data),JSON_THROW_ON_ERROR|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
    private static function dates(array $data):array{foreach($data as $key=>$value){if(is_array($value))$data[$key]=self::dates($value);elseif(is_string($value)&&preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/',$value))$data[$key]=(new \DateTimeImmutable($value,new \DateTimeZone(self::env('APP_TIMEZONE','America/New_York'))))->format(DATE_ATOM);}return $data;}
    public static function redirect(string $path):never{header('Location: '.$path, true,303);exit;}
    public static function text(mixed $value,string $label,int $max,bool $optional=false):string{if(!is_string($value)&&$value!==null)throw new HttpError('Invalid '.$label);$s=trim($value??'');if((!$optional&&$s==='')||mb_strlen($s)>$max)throw new HttpError($label.' must contain '.($optional?'no more than':'between 1 and').' '.$max.' characters.');return $s;}
    public static function id(mixed $value):int {if(!is_scalar($value)||!preg_match('/^[1-9][0-9]*$/',(string)$value)||strlen((string)$value)>15)throw new HttpError('Invalid record.',404);return (int)$value;}
    public static function base(string $path=''):string{return rtrim(self::env('BASE_URL','https://fivem-dashboard.kryndexabot.xyz'),'/').$path;}
    public static function audit(?int $actor,string $action,string $entity,int $id,array $meta=[]):void{self::query('INSERT INTO audit_logs_v2(user_id,action,entity_type,entity_id,metadata_json) VALUES(?,?,?,?,?)',[$actor,$action,$entity,$id,json_encode($meta,JSON_THROW_ON_ERROR)]);}
    public static function limit(string $scope,string $identity,int $max,int $seconds=900):void {
        $bucket=hash('sha256',$scope.':'.$identity.':'.intdiv(time(),$seconds));
        self::query('INSERT INTO php_rate_limits(bucket,request_count,expires_at) VALUES(?,1,DATE_ADD(NOW(),INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE request_count=request_count+1',[$bucket,$seconds*2]);
        if((int)(self::row('SELECT request_count FROM php_rate_limits WHERE bucket=?',[$bucket])['request_count']??0)>$max)throw new HttpError('Too many requests. Please try again later.',429);
    }
    public static function discord(string $method,string $path,?array $body=null,?string $authorization=null):array {
        if(self::$discordTransport)return (self::$discordTransport)($method,$path,$body,$authorization);
        $c=curl_init('https://discord.com/api/v10/'.$path);$headers=['Authorization: '.($authorization??'Bot '.self::env('DISCORD_BOT_TOKEN'))];
        curl_setopt_array($c,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>10,CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>$headers]);
        if($body!==null){$headers[]='Content-Type: application/json';curl_setopt($c,CURLOPT_HTTPHEADER,$headers);curl_setopt($c,CURLOPT_POSTFIELDS,json_encode($body,JSON_THROW_ON_ERROR));}
        $raw=curl_exec($c);$status=curl_getinfo($c,CURLINFO_RESPONSE_CODE);if($raw===false)throw new HttpError('Discord is unavailable. Please try again shortly.',503);
        $data=json_decode($raw,true);if($status===404)throw new HttpError('Join the community Discord to access this section.',403);if($status<200||$status>=300)throw new HttpError('Discord verification is unavailable.',503);return is_array($data)?$data:[];
    }
    public static function membership(array $user):void{if(empty($user['is_active'])||empty($user['discord_id']))throw new HttpError('An active community Discord account is required.',403);if(!self::env('DISCORD_GUILD_ID')||!self::env('DISCORD_BOT_TOKEN'))throw new HttpError('Discord membership verification is not configured.',503);static $verified=[];$identity=self::env('DISCORD_GUILD_ID').':'.$user['discord_id'];if(isset($verified[$identity]))return;self::discord('GET','guilds/'.self::env('DISCORD_GUILD_ID').'/members/'.$user['discord_id']);$verified[$identity]=true;}
}
function escape(mixed $value):string{return htmlspecialchars((string)($value??''),ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}

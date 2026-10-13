<?php
declare(strict_types=1);
namespace CommunityHub;
final class DiscordMembership {
 private static function key():string{$secret=App::env('DISCORD_TOKEN_SECRET',App::env('SESSION_SECRET'));if(strlen($secret)<32)throw new HttpError('Configure a private DISCORD_TOKEN_SECRET of at least 32 characters.',503);return hash('sha256',$secret,true);}
 private static function reauth():never{throw new HttpError('Sign in with Discord again to verify community membership.',401);}
 private static function encrypt(int $id,array $token):string{$iv=random_bytes(12);$data=openssl_encrypt(json_encode($token,JSON_THROW_ON_ERROR),'aes-256-gcm',self::key(),OPENSSL_RAW_DATA,$iv,$tag,'communityhub:'.$id);if($data===false)throw new HttpError('Discord authorization could not be saved.',503);return json_encode(['iv'=>base64_encode($iv),'tag'=>base64_encode($tag),'data'=>base64_encode($data)],JSON_THROW_ON_ERROR);}
 private static function decrypt(int $id,string $cipher):array{try{$value=json_decode($cipher,true,16,JSON_THROW_ON_ERROR);$data=openssl_decrypt(base64_decode($value['data'],true),'aes-256-gcm',self::key(),OPENSSL_RAW_DATA,base64_decode($value['iv'],true),base64_decode($value['tag'],true),'communityhub:'.$id);if($data===false)self::reauth();return json_decode($data,true,16,JSON_THROW_ON_ERROR);}catch(\Throwable $e){self::reauth();}}
 public static function store(int $id,array $token):void{if(empty($token['access_token'])||!in_array('guilds.members.read',explode(' ',$token['scope']??''),true))self::reauth();$expires=max(1,min(864000,(int)($token['expires_in']??0)));$cipher=self::encrypt($id,['access_token'=>$token['access_token'],'refresh_token'=>$token['refresh_token']??null,'scope'=>$token['scope']]);App::query('INSERT INTO discord_membership_tokens(user_id,client_id,token_cipher,expires_at) VALUES(?,?,?,DATE_ADD(NOW(),INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE client_id=VALUES(client_id),token_cipher=VALUES(token_cipher),expires_at=VALUES(expires_at)',[$id,App::env('DISCORD_CLIENT_ID'),$cipher,$expires]);}
 private static function verify(array $user,array $row):?bool{
  if($row['client_id']!==App::env('DISCORD_CLIENT_ID'))self::reauth();$token=self::decrypt((int)$user['id'],$row['token_cipher']);
  if((int)$row['remaining']<=30)$token=App::transaction(function()use($user){$row=App::row('SELECT *,TIMESTAMPDIFF(SECOND,NOW(),expires_at) remaining FROM discord_membership_tokens WHERE user_id=? FOR UPDATE',[$user['id']]);if(!$row)self::reauth();$token=self::decrypt((int)$user['id'],$row['token_cipher']);if((int)$row['remaining']>30)return $token;if(empty($token['refresh_token']))self::reauth();$curl=curl_init('https://discord.com/api/oauth2/token');curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>10,CURLOPT_HTTPHEADER=>['Content-Type: application/x-www-form-urlencoded'],CURLOPT_POSTFIELDS=>http_build_query(['client_id'=>App::env('DISCORD_CLIENT_ID'),'client_secret'=>App::env('DISCORD_CLIENT_SECRET'),'grant_type'=>'refresh_token','refresh_token'=>$token['refresh_token']])]);$raw=curl_exec($curl);$status=curl_getinfo($curl,CURLINFO_RESPONSE_CODE);if(in_array($status,[400,401,403],true))self::reauth();if($raw===false||$status!==200)throw new HttpError('Discord authorization refresh is temporarily unavailable.',503);$fresh=json_decode($raw,true);$fresh['scope']??=$token['scope'];self::store((int)$user['id'],$fresh);return $fresh;});
  try{$member=App::discord('GET','users/@me/guilds/'.App::env('DISCORD_GUILD_ID').'/member',null,'Bearer '.$token['access_token']);if(!empty($member['user']['id'])&&$member['user']['id']!==$user['discord_id'])self::reauth();return true;}catch(HttpError $e){if($e->status===403)return false;throw $e;}
 }
 public static function member(array $user):?bool {
  try{$row=App::row('SELECT *,TIMESTAMPDIFF(SECOND,NOW(),expires_at) remaining FROM discord_membership_tokens WHERE user_id=?',[$user['id']]);}catch(\PDOException $e){if(($e->errorInfo[1]??0)===1146)return null;throw $e;}
  if(!$row)return null;
  $key=hash('sha256',$user['discord_id'].':'.App::env('DISCORD_CLIENT_ID').':'.App::env('DISCORD_GUILD_ID').':'.$row['token_cipher']);
  static $local=[];$cached=session_status()===PHP_SESSION_ACTIVE?($_SESSION['discord_membership_cache'][$key]??null):($local[$key]??null);
  if($cached&&$cached['until']>time()){if(isset($cached['member']))return $cached['member'];throw new HttpError('Discord is rate limited. Please retry shortly.',429,$cached['until']-time());}
  try{$member=self::verify($user,$row);$entry=['member'=>$member,'until'=>time()+($member?60:10)];}catch(HttpError $e){if($e->status!==429)throw $e;$entry=['until'=>time()+max(1,$e->retryAfter)];$local[$key]=$entry;if(session_status()===PHP_SESSION_ACTIVE)$_SESSION['discord_membership_cache']=[$key=>$entry];throw $e;}
  $local[$key]=$entry;if(session_status()===PHP_SESSION_ACTIVE)$_SESSION['discord_membership_cache']=[$key=>$entry];return $member;
 }

}

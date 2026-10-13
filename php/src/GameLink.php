<?php
declare(strict_types=1);
namespace CommunityHub;
final class GameLink {
 public static function card(?string $error=null):void{?><section class="panel"><h2>Link game account</h2><p>Generate a six-digit code to connect CommunityHub on LB Phone.</p><?php if($error):?><p role="status"><?=escape($error)?></p><?php endif?><a class="btn" href="/fivem/link-code">Link game account</a></section><?php }
 public static function page(string $method):void{
  $u=Auth::requireUser();$error=null;$code=null;
  try{App::membership($u);}catch(HttpError $e){$error=$e->getMessage();if($method==='POST')throw $e;}
  if($method==='POST'){$code=(string)random_int(100000,999999);try{App::transaction(function()use($u,$code){App::query('DELETE FROM fivem_link_codes WHERE user_id=? OR expires_at<NOW()',[$u['id']]);App::query('INSERT INTO fivem_link_codes(user_id,code_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 5 MINUTE))',[$u['id'],hash('sha256',$code)]);});}catch(\PDOException $e){if(($e->errorInfo[1]??0)===1146)throw new HttpError('The linking-code table is missing. Ask the administrator to apply the existing FiveM migration 005 to this database.',503);throw $e;}}
  View::layout('Link game account',function()use($code,$error){View::heading('Link your game account','Connect CommunityHub on LB Phone to your Discord account.');?><section class="panel"><?php if($code):?><div class="eyebrow">YOUR SIX-DIGIT CODE</div><h2 style="font-size:48px;letter-spacing:8px"><?=escape($code)?></h2><p>Open CommunityHub in LB Phone, select Account, and enter this code.</p><p>It expires in five minutes and can be used once. Never share it.</p><?php else:?><h2>Generate a linking code</h2><p>Generate a code here, then enter it on the Account page in the phone app.</p><?php endif;if($error):?><p role="alert"><?=escape($error)?></p><p>Code generation requires verified community Discord membership. Ask the administrator to check the website's Discord configuration if verification is unavailable.</p><?php else:View::form('/fivem/link-code',[],$code?'Generate a new code':'Generate linking code');endif?></section><?php });
 }
}

<?php
declare(strict_types=1);
namespace CommunityHub;
final class Status {
 public static function snapshot():array{return ['servers'=>App::rows("SELECT s.id,s.name,s.server_key,s.max_players,s.last_heartbeat_at,s.game_hours,s.game_minutes,s.game_clock_at,\r
    IF(s.last_heartbeat_at>DATE_SUB(NOW(),INTERVAL 90 SECOND),1,0) live,\r
    IF(s.last_heartbeat_at>DATE_SUB(NOW(),INTERVAL 90 SECOND),s.current_players,0) current_players,\r
    p.state recorded_state,p.started_at state_since,\r
    history.tracked_since,COALESCE(history.online_seconds,0) online_seconds,\r
    COALESCE(history.offline_seconds,0) offline_seconds\r
    FROM fivem_servers s LEFT JOIN fivem_status_periods p ON p.server_id=s.id AND p.open_marker=1\r
    LEFT JOIN (SELECT server_id,MIN(started_at) tracked_since,\r
      SUM(IF(state='online',GREATEST(0,TIMESTAMPDIFF(SECOND,GREATEST(started_at,DATE_SUB(NOW(),INTERVAL 30 DAY)),COALESCE(ended_at,NOW()))),0)) online_seconds,\r
      SUM(IF(state='offline',GREATEST(0,TIMESTAMPDIFF(SECOND,GREATEST(started_at,DATE_SUB(NOW(),INTERVAL 30 DAY)),COALESCE(ended_at,NOW()))),0)) offline_seconds\r
      FROM fivem_status_periods GROUP BY server_id) history ON history.server_id=s.id ORDER BY s.id"),'history'=>App::rows("SELECT p.id,p.server_id,s.name server_name,p.state,p.started_at,p.ended_at,\r
    TIMESTAMPDIFF(SECOND,p.started_at,COALESCE(p.ended_at,NOW())) duration_seconds\r
    FROM fivem_status_periods p JOIN fivem_servers s ON s.id=p.server_id\r
    WHERE p.started_at>=DATE_SUB(NOW(),INTERVAL 30 DAY) OR p.ended_at IS NULL OR p.ended_at>=DATE_SUB(NOW(),INTERVAL 30 DAY)\r
    ORDER BY p.started_at DESC,p.id DESC LIMIT 100"),'updatedAt'=>date(DATE_ATOM),'refreshSeconds'=>15];}
 public static function history():void{?><section class="panel"><h2>Availability history</h2><?php View::table(self::snapshot()['history'],['server_name'=>'Server','state'=>'State','started_at'=>'From','ended_at'=>'Through','duration_seconds'=>'Seconds']);?></section><?php }
}

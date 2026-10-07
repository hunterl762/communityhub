<?php
declare(strict_types=1);
namespace CommunityHub;
final class Landing {
 public static function sections(array $c):void {
 if($c['show_section']){?><section class="panel"><h2><?=escape($c['section_title'])?></h2><?php View::prose($c['section_body']);?><div class="grid"><?php foreach(App::rows('SELECT name,slug FROM departments ORDER BY name') as $d):?><article class="card"><h3><?=escape($d['name'])?></h3></article><?php endforeach?></div></section><?php }
 if($c['show_cta']){?><section class="panel community-cta"><h2><?=escape($c['cta_title'])?></h2><p><?=escape($c['cta_body'])?></p><a class="btn" href="<?=escape($c['cta_url'])?>"><?=escape($c['cta_label'])?></a></section><?php }
 }
}

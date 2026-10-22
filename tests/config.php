<?php

require_once __DIR__.'/bootstrap.php';
require_once __DIR__.'/../src/Config.php';
require_once __DIR__.'/../src/Listener/ValidateSettings.php';

use EdgeInfinity\DiyHomepage\Config;

$count = 0;
function check(bool $condition, string $message): void {
    global $count;
    if (! $condition) throw new RuntimeException($message);
    $count++;
}
function rejected(array|string $value): bool {
    try {
        Config::validate(is_array($value) ? json_encode($value) : $value);
        return false;
    } catch (InvalidArgumentException) {
        return true;
    }
}

$config = Config::validate(file_get_contents(__DIR__.'/../resources/default.json'));
check(count($config['widgets']) === 5, 'Default configuration must validate.');
check(Config::decode('broken')['widgets'] === [], 'Malformed stored JSON must have an empty fallback.');
$validateSetting = static function (mixed $value): void {
    $settings = ['edgeinfinity-diy-homepage.hero_enabled' => $value];
    (new EdgeInfinity\DiyHomepage\Listener\ValidateSettings())->handle(new Flarum\Settings\Event\Saving($settings));
};
foreach ([true, false, 0, 1, '0', '1', ''] as $value) {
    $validateSetting($value);
    check(true, 'Valid page-banner switch value rejected.');
}
foreach (['yes', 2, null, []] as $value) {
    $invalid = false;
    try { $validateSetting($value); } catch (Flarum\Foundation\ValidationException) { $invalid = true; }
    check($invalid, 'Invalid page-banner switch value accepted.');
}
check(rejected('{'), 'Malformed JSON must be rejected on save.');
check(rejected(['version' => 2, 'widgets' => []]), 'Unsupported versions must be rejected.');
$widget = ['id' => 'one', 'type' => 'notice', 'region' => 'main', 'settings' => []];
foreach (['fullWidth', 'top', 'main', 'sidebar', 'configOnly'] as $region) {
    $regional = [...$widget, 'region' => $region];
    check(Config::validate(json_encode(['version' => 1, 'widgets' => [$regional]]))['widgets'][0] === $regional,
        'All supported regions must preserve widget settings, including configuration-only instances.');
}
check(rejected(['version' => 1, 'widgets' => [[...$widget, 'region' => 'hidden']]]), 'Unknown region must be rejected.');
check(rejected(['version' => 1, 'widgets' => [$widget, $widget]]), 'Duplicate IDs must be rejected.');
foreach (['javascript:alert(1)', '//evil.example/x', '/\\evil.example', "https://example.org/\nfoo", 'data:image/png;base64,x'] as $url) {
    $bad = $widget;
    $bad['linkUrl'] = $url;
    check(rejected(['version' => 1, 'widgets' => [$bad]]), 'Unsafe URL accepted.');
}
foreach (['/all', '/t/news?q=hello%20world', 'https://example.org/image.png', 'http://localhost/path'] as $url) {
    $good = $widget;
    $good['linkUrl'] = $url;
    check(!rejected(['version' => 1, 'widgets' => [$good]]), 'Safe URL rejected.');
}
$bad = $widget;
$bad['settings'] = ['actions' => [['url' => 'javascript:alert(1)']]];
check(rejected(['version' => 1, 'widgets' => [$bad]]), 'Unsafe nested action accepted.');
$bad['settings'] = ['ids' => '1,2,test'];
check(rejected(['version' => 1, 'widgets' => [$bad]]), 'Malformed IDs accepted.');
$bad['settings'] = ['limit' => 100];
check(rejected(['version' => 1, 'widgets' => [$bad]]), 'Excessive item count accepted.');
$bad['settings'] = ['featured' => 'false'];
check(rejected(['version' => 1, 'widgets' => [$bad]]), 'Non-boolean flag accepted.');
$bad = $widget;
$bad['audience'] = 'administrator';
check(rejected(['version' => 1, 'widgets' => [$bad]]), 'Unsupported audience accepted.');
$custom = $widget;
$custom['type'] = 'acme:custom';
$custom['settings'] = ['externalOption' => ['preserve' => true]];
check(!rejected(['version' => 1, 'widgets' => [$custom]]), 'Third-party settings must be preserved.');
$many = array_map(fn ($id) => [...$widget, 'id' => 'widget-'.$id], range(1, 51));
check(rejected(['version' => 1, 'widgets' => $many]), 'Excessive widget count accepted.');
check(rejected(str_repeat('x', 131073)), 'Excessive configuration size accepted.');
$base = ['version'=>1, 'appearance'=>['radius'=>'', 'emphasizedTitles'=>false], 'widgets'=>[$widget]];
check(!rejected($base), 'Theme radius and FoF headings must be valid.');
foreach ([0, 4, 64] as $radius) {
    $value = $base;
    $value['appearance']['radius'] = $radius;
    check(!rejected($value), 'Valid radius rejected.');
}
foreach ([-1, 65, '4px', 'url(x)'] as $radius) {
    $value = $base;
    $value['appearance']['radius'] = $radius;
    check(rejected($value), 'Invalid radius accepted.');
}
$value = $base;
$value['widgets'][0]['background'] = ['mode'=>'gradient','leftColor'=>'#abc','rightColor'=>'#aabbcc88','leftImage'=>'/image.png','rightImage'=>'https://example.org/image.png','angle'=>115,'position'=>50,'width'=>0,'imageOpacity'=>0];
check(!rejected($value), 'Valid gradient rejected.');
foreach ([['leftColor','red; color:black'],['rightImage','javascript:alert(1)'],['position',101],['width',-1],['imageOpacity',2],['mode','invalid']] as [$key,$badValue]) {
    $bad=$value;
    $bad['widgets'][0]['background'][$key]=$badValue;
    check(rejected($bad), 'Invalid background accepted.');
}
$value=$base;
$value['widgets'][0]['settings']=['texts'=>[['text'=>'Text','kind'=>'custom','fontSize'=>24,'fontFamily'=>'"Noto Sans SC", sans-serif','position'=>'afterActions','align'=>'center','showIcon'=>false,'iconImage'=>'/image.png']], 'decoration'=>['enabled'=>false,'opacity'=>0,'orbits'=>false]];
check(!rejected($value), 'Valid text/decoration rejected.');
foreach (['eyebrow', 'title', 'body', 'caption', 'custom'] as $kind) {
    $good = $value;
    $good['widgets'][0]['settings']['texts'][0]['kind'] = $kind;
    foreach ([0, 14, 120, '', '18'] as $margin) {
        $good['widgets'][0]['settings']['texts'][0]['marginBottom'] = $margin;
        check(!rejected($good), 'Valid text bottom spacing rejected for '.$kind.'.');
    }
}
foreach ([-1, 121, '14px', 'not-a-number', [], null, true, ' ', '0x10'] as $margin) {
    $bad = $value;
    $bad['widgets'][0]['settings']['texts'][0]['marginBottom'] = $margin;
    check(rejected($bad), 'Invalid text bottom spacing accepted.');
}
foreach (['eyebrow', 'title', 'body', 'caption', 'custom'] as $kind) {
    foreach ([1, 65, 100, '', '72.5'] as $width) {
        $good = $value;
        $good['widgets'][0]['settings']['texts'][0]['kind'] = $kind;
        $good['widgets'][0]['settings']['texts'][0]['safeWidth'] = $width;
        check(!rejected($good), 'Valid content safe width rejected for '.$kind.'.');
    }
}
foreach ([1, 65, 100, '', '72.5'] as $width) {
    $good = $value;
    $good['widgets'][0]['settings']['actionsSafeWidth'] = $width;
    check(!rejected($good), 'Valid button group safe width rejected.');
}
foreach ([0, -1, 101, '65%', 'not-a-number', [], null, true, ' ', '0x10'] as $width) {
    $bad = $value;
    $bad['widgets'][0]['settings']['texts'][0]['safeWidth'] = $width;
    check(rejected($bad), 'Invalid text safe width accepted.');
    $bad = $value;
    $bad['widgets'][0]['settings']['actionsSafeWidth'] = $width;
    check(rejected($bad), 'Invalid button group safe width accepted.');
}
foreach ([['light'=>'#abc','dark'=>'#123456'], ['light'=>'#abcd','dark'=>'#12345678'], ['light'=>'','dark'=>'']] as $colors) {
    $good=$value;
    $good['widgets'][0]['settings']['texts'][0]['fontColor']=$colors;
    check(!rejected($good), 'Valid theme-specific custom text colors rejected.');
}
foreach ([12, 120, '', '20'] as $size) {
    $good=$value;
    $good['widgets'][0]['settings']['texts'][0]['fontSize']=$size;
    check(!rejected($good), 'Valid custom text size rejected.');
}
$good=$value;
$good['widgets'][0]['settings']['texts'][0]['fontFamily']='';
check(!rejected($good), 'Blank custom text font must inherit the site font.');
foreach ([['kind','html'],['position','invalid'],['align','invalid'],['iconImage','data:image/png,x'],['showIcon','false']] as [$key,$badValue]) {
    $bad=$value;
    $bad['widgets'][0]['settings']['texts'][0][$key]=$badValue;
    check(rejected($bad), 'Invalid text block accepted.');
}
foreach ([['fontSize',11],['fontSize',121],['fontSize','not-a-number'],['fontFamily',[]],['fontFamily','serif; color: red'],['fontFamily',str_repeat('x',301)]] as [$key,$badValue]) {
    $bad=$value;
    $bad['widgets'][0]['settings']['texts'][0][$key]=$badValue;
    check(rejected($bad), 'Invalid custom text typography accepted: '.$key);
}
foreach (['red', ['light'=>'#fff; color:black'], ['dark'=>'#12xz'], ['light'=>['#ffffff']]] as $colors) {
    $bad=$value;
    $bad['widgets'][0]['settings']['texts'][0]['fontColor']=$colors;
    check(rejected($bad), 'Invalid custom text colors accepted.');
}
$value['widgets'][0]['settings']['texts']=[];
check(!rejected($value), 'Explicitly empty banner text must be supported.');
$value=$base;
$value['widgets'][0]['type']='stats';
$value['widgets'][0]['settings']['stats']=[['id'=>'recent','metric'=>'recentPosts','days'=>7,'enabled'=>true], ['id'=>'online','metric'=>'online','minutes'=>5,'enabled'=>false]];
check(!rejected($value), 'Valid per-item statistics rejected.');
foreach ([['metric','rawSql'],['days',0],['days',366],['enabled','true']] as [$key,$badValue]) {
    $bad=$value;
    $bad['widgets'][0]['settings']['stats'][0][$key]=$badValue;
    check(rejected($bad), 'Invalid statistic accepted.');
}
$bad=$value;
$bad['widgets'][0]['settings']['stats'][1]['id']='recent';
check(rejected($bad), 'Duplicate statistic IDs accepted.');
$bad=$base;
$bad['widgets'][0]['showIcon']='false';
check(rejected($bad), 'Non-boolean heading option accepted.');
foreach (['inherit', 'fof', 'emphasized'] as $style) {
    $value=$base;
    $value['widgets'][0]['titleStyle']=$style;
    check(!rejected($value), 'Valid per-widget title style rejected.');
}
$bad=$base;
$bad['widgets'][0]['titleStyle']='unknown';
check(rejected($bad), 'Unknown per-widget title style accepted.');
foreach ([true, false] as $flag) {
    $value=$base;
    $value['widgets'][0]['type']='discussions';
    $value['widgets'][0]['settings']=['featured'=>!$flag,'showExcerpt'=>$flag];
    check(!rejected($value), 'Excerpts must be independent of featuring a discussion.');
}
$bad=$value;
$bad['widgets'][0]['settings']['showExcerpt']='false';
check(rejected($bad), 'Non-boolean excerpt option accepted.');
$value=$base;
$value['widgets'][0]['background']=[
    'mode'=>'gradient', 'leftColor'=>'#abc',
    'light'=>['leftColor'=>'#fff','rightImage'=>'/light.png','angle'=>0,'imageOpacity'=>0],
    'dark'=>['leftColor'=>'#1234','rightColor'=>'#000000ff','leftImage'=>'https://example.org/dark.png','width'=>100,'imageFit'=>'contain'],
];
check(!rejected($value), 'Separate theme palettes with legacy fallbacks must validate.');
foreach (['light','dark'] as $theme) {
    foreach ([['leftColor','red'],['rightImage','javascript:alert(1)'],['angle',361],['position',-1],['width',101],['imageOpacity',2],['imageFit','invalid']] as [$key,$badValue]) {
        $bad=$value;
        $bad['widgets'][0]['background'][$theme][$key]=$badValue;
        check(rejected($bad), 'Invalid '.$theme.' palette accepted.');
    }
    $bad=$value;
    $bad['widgets'][0]['background'][$theme]='invalid';
    check(rejected($bad), 'Non-object theme palette accepted.');
}
$value=$base;
$value['widgets'][0]['settings']=['loadMode'=>'preload','animateNumbers'=>true,'titleFontSize'=>48,'titleFontFamily'=>'"Noto Sans SC", sans-serif'];
$value['widgets'][0]['loadingHeight']=320;
$value['widgets'][0]['background']=['mode'=>'solid','light'=>['imageFit'=>'manual','imageScale'=>145], 'dark'=>['imageFit'=>'manual','imageScale'=>75]];
check(!rejected($value), 'Loading, typography and separate manual image scales must validate.');
foreach ([['loadMode','blocking'],['animateNumbers','true'],['titleFontSize',11],['titleFontSize',121],['titleFontFamily',[]],['titleFontFamily','serif; color: red'],['titleFontFamily',str_repeat('x',301)]] as [$key,$badValue]) {
    $bad=$value;
    $bad['widgets'][0]['settings'][$key]=$badValue;
    check(rejected($bad), 'Invalid loading/typography setting accepted: '.$key);
}
foreach (['light','dark'] as $theme) {
    foreach ([0,501,'200px'] as $scale) {
        $bad=$value;
        $bad['widgets'][0]['background'][$theme]['imageScale']=$scale;
        check(rejected($bad), 'Invalid manual image scale accepted.');
    }
}
foreach ([-1,3001,'auto'] as $height) {
    $bad=$value;
    $bad['widgets'][0]['loadingHeight']=$height;
    check(rejected($bad), 'Invalid loading height accepted.');
}
echo $count." configuration checks passed.\n";

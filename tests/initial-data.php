<?php
require_once __DIR__.'/bootstrap.php';
require_once __DIR__.'/../src/Config.php';
require_once __DIR__.'/../src/Event/Searching.php';
require_once __DIR__.'/../src/QueryFilters.php';
require_once __DIR__.'/../src/InitialData.php';

use EdgeInfinity\DiyHomepage\InitialData;
use EdgeInfinity\DiyHomepage\QueryFilters;
use EdgeInfinity\DiyHomepage\Event\Searching;
use Flarum\Settings\OverrideSettingsRepository;
use Flarum\Settings\UninstalledSettingsRepository;

$count = 0;
function check(bool $condition, string $message): void {
    global $count;
    if (!$condition) throw new RuntimeException($message);
    $count++;
}
$extensions = new class extends Flarum\Extension\ExtensionManager {
    public array $enabled = ['flarum-tags', 'flarum-lock', 'flarum-sticky', 'flarum-subscriptions', 'flarum-suspend'];
    public function __construct() {}
    public function isEnabled(string $extension): bool { return in_array($extension, $this->enabled, true); }
};
$translator = new Flarum\Locale\Translator('en');
$translator->addLoader('array', new Symfony\Component\Translation\Loader\ArrayLoader);
$translations = [
    'core.lib.gambits.group_keys.is' => 'is',
    'core.lib.gambits.discussions.author.key' => 'author',
    'core.lib.gambits.discussions.created.key' => 'created',
    'core.lib.gambits.discussions.hidden.key' => 'hidden',
    'core.lib.gambits.discussions.unread.key' => 'unread',
    'core.lib.gambits.users.email.key' => 'email',
    'core.lib.gambits.users.group.key' => 'group',
    'flarum-tags.lib.gambits.discussions.tag.key' => 'tag',
    'flarum-lock.lib.gambits.discussions.locked.key' => 'locked',
    'flarum-sticky.lib.gambits.discussions.sticky.key' => 'sticky',
    'flarum-subscriptions.lib.gambits.discussions.subscription.following_key' => 'following',
    'flarum-subscriptions.lib.gambits.discussions.subscription.ignoring_key' => 'ignoring',
    'flarum-suspend.lib.gambits.users.suspended.key' => 'suspended',
];
$translator->addResource('array', $translations, 'en');
$events = new Illuminate\Events\Dispatcher;
$parser = new QueryFilters($translator, $extensions, $events);
$guest = new Flarum\User\Guest;
$member = new class extends Flarum\User\User {
    public array $allowed = [];
    public function hasPermission(string $permission): bool { return in_array($permission, $this->allowed, true); }
};
$member->id = 42;
$admin = clone $member;
$admin->allowed = ['user.editCredentials', 'user.suspend'];
$cases = [
    ['discussions', 'tag:general', ['q'=>'', 'tag'=>['general']]],
    ['discussions', 'tag:news,events tag:general -tag:private hello', ['q'=>'hello', 'tag'=>['news,events','general'], '-tag'=>['private']]],
    ['discussions', 'author:alice author:bob -author:eve hello', ['q'=>'hello','author'=>'bob','-author'=>'eve']],
    ['discussions', 'created:2026-01-01..2026-10-25', ['q'=>'','created'=>'2026-01-01..2026-10-25']],
    ['discussions', 'created:yesterday', ['q'=>'created:yesterday']],
    ['discussions', 'is:sticky -is:locked', ['q'=>'','sticky'=>true,'-locked'=>true]],
    ['discussions', 'is:hidden is:unread', ['q'=>'is:hidden is:unread']],
    ['discussions', 'is:hidden -is:unread', ['q'=>'','hidden'=>true,'-unread'=>true], 'member'],
    ['discussions', 'is:following is:ignoring', ['q'=>'','subscription'=>'ignoring'], 'member'],
    ['discussions', 'is:ignoring is:following -is:ignoring', ['q'=>'','subscription'=>'following','-subscription'=>'ignoring'], 'member'],
    ['discussions', 'is:following', ['q'=>'is:following']],
    ['discussions', 'TAG:News tag:News', ['q'=>'','tag'=>['News','News']]],
    ['discussions', "author:alice\ttag:news", ['q'=>'','author'=>"alice\ttag:news"]],
    ['discussions', '   tag:news   hello   world  ', ['q'=>'hello world','tag'=>['news']]],
    ['discussions', 'extension:custom is:custom tag:', ['q'=>'extension:custom is:custom tag:']],
    ['discussions', '0', ['q'=>'0']],
    ['discussions', 'plain words', ['q'=>'plain words']],
    ['users', 'group:1 -group:4', ['q'=>'','group'=>'1','-group'=>'4']],
    ['users', 'group:1 group:2 alice', ['q'=>'alice','group'=>'2']],
    ['users', 'email:a@example.test is:suspended', ['q'=>'email:a@example.test is:suspended']],
    ['users', 'email:a@example.test is:suspended', ['q'=>'email:a@example.test is:suspended'], 'member'],
    ['users', 'email:a@example.test -is:suspended', ['q'=>'','email'=>'a@example.test','-suspended'=>true], 'admin'],
    ['users', 'tag:general', ['q'=>'tag:general']],
];
foreach ($cases as $case) {
    [$type, $query, $expected] = $case;
    $actor = match ($case[3] ?? 'guest') { 'member' => $member, 'admin' => $admin, default => $guest };
    check($parser->forQuery($type, $query, $actor) == $expected, 'Native filter mismatch: '.$type.' '.$query);
}
$extensions->enabled = [];
check($parser->forQuery('discussions', 'tag:news is:locked is:sticky', $guest) === ['q'=>'tag:news is:locked is:sticky'], 'Disabled extension gambits must remain text.');
check($parser->forQuery('users', 'is:suspended', $admin) === ['q'=>'is:suspended'], 'Disabled suspend gambit must remain text.');
$extensions->enabled = ['flarum-tags', 'flarum-lock', 'flarum-sticky', 'flarum-subscriptions', 'flarum-suspend'];
$translator->addResource('array', array_replace($translations, [
    'core.lib.gambits.group_keys.is' => '是',
    'core.lib.gambits.discussions.author.key' => '作者',
    'flarum-tags.lib.gambits.discussions.tag.key' => '标签',
    'flarum-sticky.lib.gambits.discussions.sticky.key' => '置顶',
    'core.lib.gambits.users.group.key' => '用户组',
]), 'zh-Hans');
$translator->setLocale('zh-Hans');
check($parser->forQuery('discussions', '标签:公告 -标签:旧文 作者:用户 是:置顶 内容', $guest) == ['q'=>'内容','tag'=>['公告'],'-tag'=>['旧文'],'author'=>'用户','sticky'=>true], 'Current locale must resolve localized operators.');
check($parser->forQuery('users', '用户组:管理组', $guest) == ['q'=>'','group'=>'管理组'], 'Localized user gambit must resolve.');
check($parser->forQuery('discussions', 'tag:news', $guest) === ['q'=>'tag:news'], 'Do not invent English aliases absent from native locale registry.');
$translator->setLocale('en');
$events->listen(Searching::class, function (Searching $event) use ($guest): void {
    if ($event->type === 'discussions' && $event->filters['q'] === 'custom:example') {
        check($event->actor === $guest, 'Extension event must preserve actor.');
        $event->filters['custom'] = 'example';
        $event->filters['q'] = '';
    }
});
check($parser->forQuery('discussions', 'custom:example', $guest) == ['q'=>'','custom'=>'example'], 'Third-party adapter must run synchronously.');

$calls = new ArrayObject;
$responses = new ArrayObject;
$client = new class($calls, $responses) extends Flarum\Api\Client {
    public function __construct(private ArrayObject $calls, private ArrayObject $responses) {}
    public function send(string $method, string $path): Psr\Http\Message\ResponseInterface {
        $this->calls[] = ['path'=>$path, 'params'=>$this->queryParams, 'actor'=>Flarum\Http\RequestUtil::getActor($this->parent)];
        if (count($this->responses)) {
            $next = $this->responses[0];
            $this->responses->exchangeArray(array_slice($this->responses->getArrayCopy(), 1));
            return new Laminas\Diactoros\Response\JsonResponse($next['body'] ?? ['data'=>[]], $next['status'] ?? 200);
        }
        if ($path === '/diy-homepage/stats') return new Laminas\Diactoros\Response\JsonResponse(['items'=>[]]);
        $data = ['type'=>str_starts_with($path, '/users') ? 'users' : 'discussions', 'id'=>'9'];
        return new Laminas\Diactoros\Response\JsonResponse(['data'=>$path === '/users/9' ? $data : [$data]]);
    }
};
$run = static function (array $widgets, $actor = null) use ($client, $extensions, $guest, $parser): array {
    $settings = new OverrideSettingsRepository(new UninstalledSettingsRepository, [
        'edgeinfinity-diy-homepage.config'=>json_encode(['version'=>1,'widgets'=>$widgets]),
    ]);
    $request = Flarum\Http\RequestUtil::withActor(new Laminas\Diactoros\ServerRequest, $actor ?? $guest);
    return (new InitialData($client, $settings, new Psr\Log\NullLogger, $extensions, $parser))->forRequest($request);
};
$widget = ['id'=>'collection','type'=>'discussions','region'=>'main','enabled'=>true,'settings'=>['limit'=>1]];
foreach ($cases as $case) {
    [$type, $query, $expected] = $case;
    $actor = match ($case[3] ?? 'guest') { 'member'=>$member, 'admin'=>$admin, default=>$guest };
    $calls->exchangeArray([]);
    $queried = [...$widget, 'type'=>$type, 'settings'=>['query'=>$query,'loadMode'=>'preload','limit'=>1]];
    check(isset($run([$queried], $actor)['collection']), 'Configured query must be preloaded: '.$query);
    check(count($calls) === 1 && $calls[0]['params']['filter'] == $expected, 'Preload must send native structured filters.');
    check($calls[0]['actor'] === $actor, 'Preload must preserve request actor.');
    $calls->exchangeArray([]);
    $queried['settings']['loadMode'] = 'async';
    check($run([$queried], $actor) === [] && count($calls) === 0, 'Explicit async must not preload a query.');
}
foreach (['discussions','users'] as $type) {
    foreach (['','   '] as $query) {
        $calls->exchangeArray([]);
        check(isset($run([[...$widget,'type'=>$type,'settings'=>['query'=>$query,'limit'=>1]]])['collection']), 'Blank collections must preload.');
        check(!isset($calls[0]['params']['filter']), 'Blank queries do not add full-text filters.');
    }
    $calls->exchangeArray([]);
    check($run([[...$widget,'type'=>$type,'settings'=>['ids'=>'9','query'=>'tag:news','limit'=>1]]])['collection']['payload']['data'][0]['id'] === '9', 'Explicit IDs retain precedence over query.');
    check(!isset($calls[0]['params']['filter']['tag']), 'Do not constrain selected IDs by search.');
}
$record = static fn ($id) => ['type'=>'discussions','id'=>(string)$id];
$calls->exchangeArray([]);
$responses->exchangeArray([
    ['body'=>['data'=>[$record(9),$record(7)],'included'=>[['type'=>'tags','id'=>'1']]]],
    ['body'=>['data'=>[$record(9)],'links'=>['next'=>'next']]],
    ['body'=>['data'=>[$record(10)],'included'=>[['type'=>'tags','id'=>'1'],['type'=>'tags','id'=>'2']]]],
]);
$data = $run([[...$widget,'settings'=>['ids'=>'7,9','query'=>'tag:news','limit'=>3]]])['collection']['payload'];
check(array_column($data['data'],'id') === ['7','9','10'], 'Selected order and paged query deduplication must be preserved.');
check($calls[0]['params']['filter'] === ['id'=>'7,9'], 'Selected IDs get their own unfiltered request.');
check($calls[1]['params']['filter'] == ['q'=>'','tag'=>['news']], 'Fill query must use structured tags.');
check($calls[2]['params']['page']['offset'] === 1, 'Fill pagination must advance.');
check(count($data['included']) === 2, 'Included resources must merge without duplicates.');
foreach ([['enabled'=>false], ['region'=>'configOnly'], ['audience'=>'members'], ['settings'=>['loadMode'=>'async']]] as $override) {
    $calls->exchangeArray([]);
    check($run([[...$widget,...$override]]) === [] && count($calls) === 0, 'Disabled, config-only, audience and async rules must remain.');
}
check($run([[...$widget,'audience'=>'guests']], $member) === [], 'Members must not preload guest-only widgets.');
check(isset($run([[...$widget,'audience'=>'members']], $member)['collection']), 'Members can preload their own widgets.');
$responses->exchangeArray([['status'=>500]]);
check(array_keys($run([$widget,[...$widget,'id'=>'stats','type'=>'stats']])) === ['stats'], 'Failed preload must leave other widgets intact and allow browser retry.');
echo $count." query/preload regression checks passed.\n";

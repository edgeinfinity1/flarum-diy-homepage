<?php
require __DIR__.'/bootstrap.php';
use EdgeInfinity\DiyHomepage\Config;
use EdgeInfinity\DiyHomepage\HomeMode;
use EdgeInfinity\DiyHomepage\Listener\ValidateSettings;
use EdgeInfinity\DiyHomepage\Middleware\GuestHomepage;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\Settings\Event\Saving;
use Flarum\User\Guest;
use Flarum\User\User;
use Flarum\Http\RequestUtil;
use Flarum\Http\RouteHandlerFactory;
use Laminas\Diactoros\ServerRequest;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
class FeatureSettings implements SettingsRepositoryInterface {
    public function __construct(public array $values) {}
    public function all(): array { return $this->values; }
    public function get(string $key, mixed $default = null): mixed { return $this->values[$key] ?? $default; }
    public function set(string $key, mixed $value): void { throw new RuntimeException('Unexpected write'); }
    public function delete(string $keyLike): void { throw new RuntimeException('Unexpected delete'); }
}
$checks=0;
$check=function($ok,$name)use(&$checks){if(!$ok)throw new RuntimeException($name);$checks++;};
foreach(['enabled','disabled','guests'] as $mode) foreach([true,false] as $guest) foreach(['/all','/tags','/home'] as $default) {
    $settings=new FeatureSettings(['edgeinfinity-diy-homepage.home_mode'=>$mode,'default_route'=>$default]);
    $home=$mode==='enabled'||($mode==='guests'&&$guest);
    $check(HomeMode::usesHome($settings,$guest)===$home,'root audience');
    $check(HomeMode::defaultRoute($settings,$guest)===($home?'/home':($default==='/home'?'/all':$default)),'default route');
    foreach(['default','index','diy-homepage'] as $route){
        $factory=new class extends RouteHandlerFactory {
            public ?string $target=null;
            public function __construct(){}
            public function toForum(?string $content=null):Closure{$this->target=$content;return fn()=>new JsonResponse([]);}
        };
        $next=new class implements RequestHandlerInterface {
            public ?ServerRequestInterface $request=null;
            public function handle(ServerRequestInterface $request):ResponseInterface{$this->request=$request;return new JsonResponse([],200,['X-Downstream'=>'yes']);}
        };
        $request=RequestUtil::withActor(new ServerRequest([],[],'/','GET'),$guest?new Guest():new User())->withAttribute('routeName',$route)->withAttribute('routeParameters',['original'=>1]);
        $response=(new GuestHomepage($settings,$factory))->process($request,$next);
        $expected=$route==='default'&&$home?'diy-homepage':($route==='default'&&$default==='/home'?'index':$route);
        $check($next->request->getAttribute('routeName')===$expected,'HTTP routing '.$mode.' '.$default.' '.$route);
        if($factory->target!==null){
            $check(class_exists($factory->target),'HTTP content handler exists');
            $check($factory->target===($home?EdgeInfinity\DiyHomepage\Content\Home::class:Flarum\Forum\Content\Index::class),'HTTP content handler matches actor policy');
        }
        $check($response->getHeaderLine('X-Downstream')==='yes','downstream preserved');
    }
}
foreach([['1','/all','guests'],['0','/all','disabled'],['0','/home','enabled'],['1','/tags','guests']] as [$old,$route,$expected]){
    $check(HomeMode::mode(new FeatureSettings(['edgeinfinity-diy-homepage.guest_home'=>$old,'default_route'=>$route]))===$expected,'legacy compatibility');
}
$base=['version'=>1,'widgets'=>[['id'=>'test','type'=>'stats','region'=>'main','settings'=>[]]]];
$good=[['noBottomPadding'=>true,'noBottomMargin'=>false],['settings'=>['dividerStyle'=>'blank','height'=>0]],['settings'=>['dividerStyle'=>'line','height'=>300]],['settings'=>['statsNumberFontSize'=>40,'statsNumberFontWeight'=>'normal','statsNumberFontFamily'=>'Georgia, serif','statsLabelFontSize'=>12,'statsLabelFontWeight'=>'bold']],['settings'=>['actions'=>[['action'=>'all','style'=>'secondary']]]]];
foreach($good as $patch){$config=$base;$config['widgets'][0]=array_replace($config['widgets'][0],$patch);$check(Config::validate(json_encode($config))===$config,'valid feature config');}
$bad=[['noBottomPadding'=>'yes'],['noBottomMargin'=>1],['settings'=>['dividerStyle'=>'script']],['settings'=>['height'=>-1]],['settings'=>['height'=>301]],['settings'=>['height'=>false]],['settings'=>['statsNumberFontSize'=>false]],['settings'=>['statsNumberFontSize'=>121]],['settings'=>['statsLabelFontSize'=>7]],['settings'=>['statsLabelFontFamily'=>'serif; color:red']],['settings'=>['statsLabelFontWeight'=>true]],['settings'=>['statsNumberFontWeight'=>'bolder']],['settings'=>['actions'=>[['style'=>'danger']]]]];
foreach($bad as $patch){$config=$base;$config['widgets'][0]=array_replace($config['widgets'][0],$patch);$rejected=false;try{Config::validate(json_encode($config));}catch(InvalidArgumentException){$rejected=true;}$check($rejected,'invalid feature config '.json_encode($patch));}
foreach(['enabled','disabled','guests'] as $mode){
    $values=['edgeinfinity-diy-homepage.home_mode'=>$mode];
    (new ValidateSettings())->handle(new Saving($values));$check(true,'valid mode save');
}
foreach(['', 'invalid', true, 1, ['enabled']] as $mode){
    $values=['edgeinfinity-diy-homepage.home_mode'=>$mode];$rejected=false;
    try{(new ValidateSettings())->handle(new Saving($values));}catch(Flarum\Foundation\ValidationException){$rejected=true;}
    $check($rejected,'invalid mode save rejected');
}
$values=['edgeinfinity-diy-homepage.nav_label'=>'Home'];(new ValidateSettings())->handle(new Saving($values));$check(true,'unrelated save does not require a mode');
echo "$checks feature checks passed.\n";

<?php

require __DIR__.'/bootstrap.php';
require_once __DIR__.'/../src/Middleware/GuestHomepage.php';

use EdgeInfinity\DiyHomepage\Content\Home;
use EdgeInfinity\DiyHomepage\Middleware\GuestHomepage;
use Flarum\Http\RequestUtil;
use Flarum\Http\RouteHandlerFactory;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\Guest;
use Flarum\User\User;
use Laminas\Diactoros\Response\JsonResponse;
use Laminas\Diactoros\ServerRequest;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class TestSettings implements SettingsRepositoryInterface {
    public function __construct(public mixed $enabled) {}
    public function all(): array { return []; }
    public function get(string $key, mixed $default = null): mixed { return $this->enabled; }
    public function set(string $key, mixed $value): void {}
    public function delete(string $keyLike): void {}
}
class TestFactory extends RouteHandlerFactory {
    public ?string $content = null;
    public function __construct() {}
    public function toForum(?string $content = null): Closure {
        $this->content = $content;
        return fn () => new JsonResponse(['home' => true]);
    }
}
class Downstream implements RequestHandlerInterface {
    public ?ServerRequestInterface $request = null;
    public function handle(ServerRequestInterface $request): ResponseInterface {
        $this->request = $request;
        return new JsonResponse(['downstream' => true], 200, ['X-Test-Downstream' => 'preserved']);
    }
}

$cases = [
    ['1', new Guest(), 'default', true],
    [true, new Guest(), 'default', true],
    ['0', new Guest(), 'default', false],
    [false, new Guest(), 'default', false],
    ['1', new User(), 'default', false],
    ['1', new Guest(), 'index', false],
    ['1', new Guest(), 'diy-homepage', false],
];
foreach ($cases as [$enabled, $actor, $route, $changes]) {
    $original = fn () => new JsonResponse(['original' => true]);
    $request = RequestUtil::withActor(new ServerRequest([], [], '/', 'GET'), $actor)
        ->withAttribute('routeName', $route)
        ->withAttribute('routeHandler', $original)
        ->withAttribute('routeParameters', ['original' => 1]);
    $factory = new TestFactory();
    $next = new Downstream();
    $response = (new GuestHomepage(new TestSettings($enabled), $factory))->process($request, $next);
    if ($response->getHeaderLine('X-Test-Downstream') !== 'preserved' || !$next->request) {
        throw new RuntimeException('Subsequent maintenance, CSRF and response-header middleware must still execute.');
    }
    if ($changes) {
        if ($next->request->getAttribute('routeName') !== 'diy-homepage'
            || $factory->content !== Home::class || $next->request->getAttribute('routeParameters') !== []) {
            throw new RuntimeException('Guest default route was not rewritten correctly.');
        }
    } elseif ($next->request !== $request || $factory->content !== null) {
        throw new RuntimeException('An unrelated route or actor was changed.');
    }
}
echo count($cases)." middleware cases passed; downstream middleware preserved.\n";

<?php

namespace EdgeInfinity\DiyHomepage\Middleware;

use EdgeInfinity\DiyHomepage\Content\Home;
use Flarum\Http\RequestUtil;
use EdgeInfinity\DiyHomepage\HomeMode;
use Flarum\Forum\Content\Index;
use Flarum\Http\RouteHandlerFactory;
use Flarum\Settings\SettingsRepositoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class GuestHomepage implements MiddlewareInterface
{
    public function __construct(private SettingsRepositoryInterface $settings, private RouteHandlerFactory $factory)
    {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if ($request->getAttribute('routeName') === 'default'
            && HomeMode::usesHome($this->settings, RequestUtil::getActor($request)->isGuest())) {
            $request = $request
                ->withAttribute('routeName', 'diy-homepage')
                ->withAttribute('routeHandler', $this->factory->toForum(Home::class))
                ->withAttribute('routeParameters', []);
        }

        if ($request->getAttribute('routeName') === 'default'
            && $this->settings->get('default_route') === '/home'
            && !HomeMode::usesHome($this->settings, RequestUtil::getActor($request)->isGuest())) {
            $request = $request->withAttribute('routeName', 'index')
                ->withAttribute('routeHandler', $this->factory->toForum(Index::class))
                ->withAttribute('routeParameters', []);
        }

        return $handler->handle($request);
    }
}

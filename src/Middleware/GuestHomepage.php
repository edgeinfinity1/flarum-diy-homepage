<?php

namespace EdgeInfinity\DiyHomepage\Middleware;

use EdgeInfinity\DiyHomepage\Content\Home;
use Flarum\Http\RequestUtil;
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
            && RequestUtil::getActor($request)->isGuest()
            && (bool) $this->settings->get('edgeinfinity-diy-homepage.guest_home', true)) {
            $request = $request
                ->withAttribute('routeName', 'diy-homepage')
                ->withAttribute('routeHandler', $this->factory->toForum(Home::class))
                ->withAttribute('routeParameters', []);
        }

        return $handler->handle($request);
    }
}

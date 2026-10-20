<?php

namespace EdgeInfinity\DiyHomepage\Content;

use Flarum\Frontend\Document;
use Flarum\Http\RequestUtil;
use Flarum\Http\UrlGenerator;
use Flarum\Settings\SettingsRepositoryInterface;
use Psr\Http\Message\ServerRequestInterface;

class Canonical
{
    public function __construct(private SettingsRepositoryInterface $settings, private UrlGenerator $url)
    {
    }

    public function __invoke(Document $document, ServerRequestInterface $request): void
    {
        // Core's Index canonical uses the global default; guests have their own default here.
        if ($request->getAttribute('routeName') === 'index'
            && RequestUtil::getActor($request)->isGuest()
            && (bool) $this->settings->get('edgeinfinity-diy-homepage.guest_home', true)) {
            $document->canonicalUrl = $this->url->to('forum')->base().'/all';
        }
    }
}

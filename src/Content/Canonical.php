<?php

namespace EdgeInfinity\DiyHomepage\Content;

use Flarum\Frontend\Document;
use Flarum\Http\RequestUtil;
use EdgeInfinity\DiyHomepage\HomeMode;
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
        // Keep the index canonical consistent with the actor-specific root route.
        if ($request->getAttribute('routeName') === 'index'
            && HomeMode::usesHome($this->settings, RequestUtil::getActor($request)->isGuest())) {
            $document->canonicalUrl = $this->url->to('forum')->base().'/all';
        }
    }
}

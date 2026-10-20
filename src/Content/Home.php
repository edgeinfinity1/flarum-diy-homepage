<?php

namespace EdgeInfinity\DiyHomepage\Content;

use EdgeInfinity\DiyHomepage\InitialData;
use Flarum\Frontend\Document;
use Flarum\Http\RequestUtil;
use Flarum\Http\UrlGenerator;
use Flarum\Locale\TranslatorInterface;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Contracts\View\Factory;
use Psr\Http\Message\ServerRequestInterface;

class Home
{
    public function __construct(
        private SettingsRepositoryInterface $settings,
        private TranslatorInterface $translator,
        private UrlGenerator $url,
        private Factory $view,
        private InitialData $initialData,
    ) {
    }

    public function __invoke(Document $document, ServerRequestInterface $request): void
    {
        RequestUtil::getActor($request)->assertCan('viewForum');
        $title = $this->settings->get('edgeinfinity-diy-homepage.nav_label')
            ?: $this->translator->trans('edgeinfinity-diy-homepage.forum.home');
        $description = $this->settings->get('edgeinfinity-diy-homepage.hero_subtitle')
            ?: $this->settings->get('forum_description');
        $allUrl = $this->url->to('forum')->base().'/all';
        $document->title = $title;
        $document->meta['description'] = $description;
        $document->canonicalUrl = $this->url->to('forum')->base().'/home';
        $document->content = $this->view->make('edgeinfinity-diy-homepage::home', compact('title', 'description', 'allUrl'));
        $document->payload['diyHomepageData'] = $this->initialData->forRequest($request);
    }
}

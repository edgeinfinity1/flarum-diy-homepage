<?php

use EdgeInfinity\DiyHomepage\Api\ForumFields;
use EdgeInfinity\DiyHomepage\Api\StatsController;
use EdgeInfinity\DiyHomepage\Config;
use EdgeInfinity\DiyHomepage\Content\Home;
use EdgeInfinity\DiyHomepage\Content\Canonical;
use EdgeInfinity\DiyHomepage\Listener\ValidateSettings;
use EdgeInfinity\DiyHomepage\Middleware\GuestHomepage;
use Flarum\Api\Resource\ForumResource;
use Flarum\Extend;
use Flarum\Settings\Event\Saving;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less')
        ->route('/home', 'diy-homepage', Home::class)
        ->content(Canonical::class, -100),
    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),
    new Extend\Locales(__DIR__.'/locale'),
    (new Extend\View())->namespace('edgeinfinity-diy-homepage', __DIR__.'/views'),
    (new Extend\Settings())
        ->default('edgeinfinity-diy-homepage.guest_home', true)
        ->default('edgeinfinity-diy-homepage.sticky_sidebar', true)
        ->default('edgeinfinity-diy-homepage.nav_label', '')
        ->default('edgeinfinity-diy-homepage.hero_enabled', true)
        ->default('edgeinfinity-diy-homepage.hero_subtitle', '')
        ->default('edgeinfinity-diy-homepage.hero_title', '')
        ->default('edgeinfinity-diy-homepage.hero_show_icon', true)
        ->default('edgeinfinity-diy-homepage.hero_icon', 'fas fa-house')
        ->default('edgeinfinity-diy-homepage.hero_icon_image', '')
        ->default('edgeinfinity-diy-homepage.config', file_get_contents(__DIR__.'/resources/default.json'))
        ->serializeToForum('diyHomepage.guestHome', 'edgeinfinity-diy-homepage.guest_home', 'boolval')
        ->serializeToForum('diyHomepage.stickySidebar', 'edgeinfinity-diy-homepage.sticky_sidebar', 'boolval')
        ->serializeToForum('diyHomepage.navLabel', 'edgeinfinity-diy-homepage.nav_label')
        ->serializeToForum('diyHomepage.heroEnabled', 'edgeinfinity-diy-homepage.hero_enabled', 'boolval')
        ->serializeToForum('diyHomepage.heroSubtitle', 'edgeinfinity-diy-homepage.hero_subtitle')
        ->serializeToForum('diyHomepage.heroTitle', 'edgeinfinity-diy-homepage.hero_title')
        ->serializeToForum('diyHomepage.heroShowIcon', 'edgeinfinity-diy-homepage.hero_show_icon', 'boolval')
        ->serializeToForum('diyHomepage.heroIcon', 'edgeinfinity-diy-homepage.hero_icon')
        ->serializeToForum('diyHomepage.heroIconImage', 'edgeinfinity-diy-homepage.hero_icon_image'),
    (new Extend\ApiResource(ForumResource::class))->fields(ForumFields::class),
    (new Extend\Middleware('forum'))
        ->insertAfter('flarum.forum.route_resolver', GuestHomepage::class),
    (new Extend\Routes('api'))->get('/diy-homepage/stats', 'diy-homepage.stats', StatsController::class),
    (new Extend\Event())->listen(Saving::class, ValidateSettings::class),
];

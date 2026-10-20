<?php

namespace EdgeInfinity\DiyHomepage\Api;

use EdgeInfinity\DiyHomepage\Config;
use EdgeInfinity\DiyHomepage\Stats;
use Flarum\Api\Context;
use Flarum\Api\Schema\Arr;
use Flarum\Api\Schema\Boolean;
use Flarum\Api\Schema\Str;
use Flarum\Settings\SettingsRepositoryInterface;

class ForumFields
{
    public function __construct(private SettingsRepositoryInterface $settings)
    {
    }

    public function __invoke(): array
    {
        return [
            Boolean::make('diyHomepage.canViewOnlineCount')->get(fn ($model, Context $context) => Stats::canViewOnline($context->getActor())),
            Str::make('defaultRoute')->get(fn ($model, Context $context) =>
                $context->getActor()->isGuest() && (bool) $this->settings->get('edgeinfinity-diy-homepage.guest_home', true)
                    ? '/home' : $this->settings->get('default_route')
            ),
            Arr::make('diyHomepage.config')->get(function ($model, Context $context) {
                $config = Config::decode($this->settings->get('edgeinfinity-diy-homepage.config'));
                $guest = $context->getActor()->isGuest();
                $visible = static fn (array $item): bool => match ($item['audience'] ?? 'all') {
                    'members' => ! $guest,
                    'guests' => $guest,
                    default => true,
                };
                $config['widgets'] = array_values(array_filter($config['widgets'],
                    static fn (array $widget): bool => ($widget['enabled'] ?? true) !== false && $visible($widget)
                ));
                foreach ($config['widgets'] as &$widget) {
                    foreach (['links', 'actions'] as $key) {
                        if (isset($widget['settings'][$key])) {
                            $widget['settings'][$key] = array_values(array_filter($widget['settings'][$key], $visible));
                        }
                    }
                }

                return $config;
            }),
        ];
    }
}

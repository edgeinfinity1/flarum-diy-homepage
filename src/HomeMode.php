<?php

namespace EdgeInfinity\DiyHomepage;

use Flarum\Settings\SettingsRepositoryInterface;

/** Root-page policy shared by HTTP routing, API routing and canonical URLs. */
class HomeMode
{
    public static function mode(SettingsRepositoryInterface $settings): string
    {
        $mode = $settings->get('edgeinfinity-diy-homepage.home_mode');
        if (in_array($mode, ['enabled', 'disabled', 'guests'], true)) return $mode;

        if ($settings->get('default_route') === '/home') return 'enabled';

        // Existing installations retain the old guest-only preference.
        return (bool) $settings->get('edgeinfinity-diy-homepage.guest_home', true) ? 'guests' : 'disabled';
    }

    public static function usesHome(SettingsRepositoryInterface $settings, bool $guest): bool
    {
        return match (self::mode($settings)) {
            'enabled' => true,
            'guests' => $guest,
            default => false,
        };
    }

    public static function defaultRoute(SettingsRepositoryInterface $settings, bool $guest): string
    {
        if (self::usesHome($settings, $guest)) return '/home';
        $route = $settings->get('default_route') ?: '/all';
        // Selecting /home globally must not override the explicit audience policy.
        return $route === '/home' ? '/all' : $route;
    }
}

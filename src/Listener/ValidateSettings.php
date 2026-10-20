<?php

namespace EdgeInfinity\DiyHomepage\Listener;

use EdgeInfinity\DiyHomepage\Config;
use Flarum\Foundation\ValidationException;
use Flarum\Settings\Event\Saving;
use InvalidArgumentException;

class ValidateSettings
{
    public function handle(Saving $event): void
    {
        $key = 'edgeinfinity-diy-homepage.config';
        if (array_key_exists($key, $event->settings)) {
            try {
                if (! is_string($event->settings[$key])) {
                    throw new InvalidArgumentException('Configuration must be a JSON string.');
                }
                Config::validate($event->settings[$key]);
            } catch (InvalidArgumentException $e) {
                throw new ValidationException([$key => $e->getMessage()]);
            }
        }
        foreach (['guest_home', 'sticky_sidebar', 'hero_show_icon'] as $name) {
            $key = 'edgeinfinity-diy-homepage.'.$name;
            if (isset($event->settings[$key]) && ! in_array($event->settings[$key], [true, false, 0, 1, '0', '1', ''], true)) {
                throw new ValidationException([$key => 'Expected a boolean.']);
            }
        }
        $key = 'edgeinfinity-diy-homepage.nav_label';
        if (isset($event->settings[$key]) && (! is_string($event->settings[$key]) || mb_strlen($event->settings[$key]) > 80)) {
            throw new ValidationException([$key => 'Use a navigation label of at most 80 characters.']);
        }
        $key = 'edgeinfinity-diy-homepage.hero_subtitle';
        if (isset($event->settings[$key]) && (! is_string($event->settings[$key]) || mb_strlen($event->settings[$key]) > 2000)) {
            throw new ValidationException([$key => 'Use a subtitle of at most 2000 characters.']);
        }
        foreach (['hero_title' => 200, 'hero_icon' => 200, 'hero_icon_image' => 2000] as $name => $max) {
            $key = 'edgeinfinity-diy-homepage.'.$name;
            if (!array_key_exists($key, $event->settings)) continue;
            try {
                if (!is_string($event->settings[$key]) || mb_strlen($event->settings[$key]) > $max) {
                    throw new InvalidArgumentException('Use text of at most '.$max.' characters.');
                }
                if ($name === 'hero_icon_image') Config::url($event->settings[$key]);
            } catch (InvalidArgumentException $e) {
                throw new ValidationException([$key => $e->getMessage()]);
            }
        }
    }
}

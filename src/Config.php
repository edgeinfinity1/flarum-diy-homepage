<?php

namespace EdgeInfinity\DiyHomepage;

use InvalidArgumentException;
use JsonException;

class Config
{
    public static function decode(?string $value): array
    {
        try {
            $config = json_decode($value ?: '{}', true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return ['version' => 1, 'widgets' => []];
        }

        return is_array($config) && is_array($config['widgets'] ?? null)
            ? $config : ['version' => 1, 'widgets' => []];
    }

    public static function validate(string $value): array
    {
        if (strlen($value) > 131072) {
            throw new InvalidArgumentException('Configuration exceeds 128 KiB.');
        }

        try {
            $config = json_decode($value, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new InvalidArgumentException('Enter valid JSON.');
        }

        if (! is_array($config) || ($config['version'] ?? null) !== 1
            || ! is_array($config['widgets'] ?? null) || ! array_is_list($config['widgets'])
            || count($config['widgets']) > 50) {
            throw new InvalidArgumentException('Expected version 1 and a widgets array with at most 50 items.');
        }

        $appearance = $config['appearance'] ?? [];
        if (!is_array($appearance)) throw new InvalidArgumentException('Appearance must be an object.');
        self::number($appearance, 'radius', 0, 64, true);
        self::booleans($appearance, ['emphasizedTitles']);
        $ids = [];
        foreach ($config['widgets'] as $widget) {
            if (! is_array($widget) || ! is_string($widget['id'] ?? null)
                || ! preg_match('/^[a-zA-Z0-9_-]{1,64}$/D', $widget['id'])
                || in_array($widget['id'], $ids, true)) {
                throw new InvalidArgumentException('Each widget needs a unique ID (letters, numbers, hyphens and underscores; up to 64 characters).');
            }
            $ids[] = $widget['id'];
            if (! is_string($widget['type'] ?? null) || ! preg_match('/^[a-zA-Z0-9_.:-]{1,100}$/D', $widget['type'])
                || ! in_array($widget['region'] ?? null, ['fullWidth', 'top', 'main', 'sidebar', 'configOnly'], true)
                || ! in_array($widget['audience'] ?? 'all', ['all', 'guests', 'members'], true)) {
                throw new InvalidArgumentException('Invalid widget type, region or audience: '.$widget['id']);
            }
            if (isset($widget['enabled']) && ! is_bool($widget['enabled'])) {
                throw new InvalidArgumentException('enabled must be a boolean.');
            }
            foreach (['title', 'subtitle', 'icon', 'iconImage', 'linkLabel', 'linkUrl'] as $field) {
                if (isset($widget[$field]) && (! is_string($widget[$field]) || mb_strlen($widget[$field]) > 2000)) {
                    throw new InvalidArgumentException('Invalid '.$field.' for '.$widget['id']);
                }
            }
            self::url($widget['linkUrl'] ?? '');
            self::url($widget['iconImage'] ?? '');
            self::booleans($widget, ['showIcon', 'showTitle']);
            self::number($widget, 'loadingHeight', 0, 3000, true);
            if (isset($widget['titleStyle']) && !in_array($widget['titleStyle'], ['inherit', 'fof', 'emphasized'], true)) {
                throw new InvalidArgumentException('Invalid widget title style.');
            }
            self::background($widget['background'] ?? []);
            $settings = $widget['settings'] ?? [];
            if (! is_array($settings)) {
                throw new InvalidArgumentException('Widget settings must be an object.');
            }
            if (isset($settings['loadMode']) && !in_array($settings['loadMode'], ['preload','async'], true)) throw new InvalidArgumentException('Invalid loading mode.');
            self::typography($settings);
            self::number($settings, 'actionsSafeWidth', 1, 100, true);
            self::booleans($settings, ['animateNumbers']);
            if (isset($settings['actionsAlign']) && !in_array($settings['actionsAlign'], ['left','center','right'], true)) {
                throw new InvalidArgumentException('Invalid actions alignment.');
            }
            self::texts($settings['texts'] ?? null);
            self::decoration($settings['decoration'] ?? []);
            self::stats($settings['stats'] ?? null);
            foreach (['imageUrl', 'url'] as $key) {
                self::url($settings[$key] ?? '');
            }
            foreach (['text', 'eyebrow', 'alt', 'caption', 'query', 'ids', 'placeholder', 'widgetId', 'sort', 'tone'] as $key) {
                if (isset($settings[$key]) && (! is_string($settings[$key]) || mb_strlen($settings[$key]) > 12000)) {
                    throw new InvalidArgumentException('Invalid '.$key.' for '.$widget['id']);
                }
            }
            foreach (['featured', 'showBio', 'showExcerpt'] as $key) {
                if (isset($settings[$key]) && ! is_bool($settings[$key])) {
                    throw new InvalidArgumentException($key.' must be a boolean.');
                }
            }
            if (isset($settings['limit']) && (! is_numeric($settings['limit']) || $settings['limit'] < 1 || $settings['limit'] > 20)) {
                throw new InvalidArgumentException('Widget limit must be between 1 and 20.');
            }
            if (isset($settings['ids']) && trim($settings['ids']) !== ''
                && (! preg_match('/^\d+(?:[\s,]+\d+)*$/D', trim($settings['ids'])) || count(preg_split('/[\s,]+/', trim($settings['ids']))) > 20)) {
                throw new InvalidArgumentException('Use up to 20 numeric IDs, separated by commas or spaces.');
            }
            foreach (['links', 'actions'] as $key) {
                if (! isset($settings[$key])) {
                    continue;
                }
                if (! is_array($settings[$key]) || ! array_is_list($settings[$key]) || count($settings[$key]) > 12) {
                    throw new InvalidArgumentException('Use at most 12 links or actions per widget.');
                }
                foreach ($settings[$key] as $link) {
                    if (! is_array($link)) {
                        throw new InvalidArgumentException('Each link must be an object.');
                    }
                    foreach (['label', 'icon', 'url', 'action'] as $field) {
                        if (isset($link[$field]) && (! is_string($link[$field]) || mb_strlen($link[$field]) > 2000)) {
                            throw new InvalidArgumentException('Invalid link '.$field.'.');
                        }
                    }
                    if (! in_array($link['audience'] ?? 'all', ['all', 'guests', 'members'], true)) {
                        throw new InvalidArgumentException('Invalid link audience.');
                    }
                    self::url($link['url'] ?? '');
                    self::url($link['iconImage'] ?? '');
                    self::booleans($link, ['showIcon']);
                }
            }
        }

        return $config;
    }

    private static function typography(array $settings): void
    {
        self::number($settings, 'titleFontSize', 12, 120, true);
        self::fontFamily($settings, 'titleFontFamily');
    }

    private static function fontFamily(array $values, string $key): void
    {
        if (isset($values[$key]) && (!is_string($values[$key]) || mb_strlen($values[$key]) > 300
            || preg_match('/[;{}<>\\\\\x00-\x1f]/', $values[$key]))) throw new InvalidArgumentException('Use a font family list of at most 300 characters.');
    }

    private static function booleans(array $item, array $keys): void
    {
        foreach ($keys as $key) {
            if (isset($item[$key]) && !is_bool($item[$key])) throw new InvalidArgumentException($key.' must be a boolean.');
        }
    }

    private static function number(array $item, string $key, int|float $min, int|float $max, bool $blank = false): void
    {
        if (!array_key_exists($key, $item) || ($blank && $item[$key] === '')) return;
        if (!is_numeric($item[$key]) || !is_finite((float) $item[$key]) || $item[$key] < $min || $item[$key] > $max) {
            throw new InvalidArgumentException($key.' must be between '.$min.' and '.$max.'.');
        }
    }

    private static function background(mixed $background): void
    {
        if (!is_array($background)) throw new InvalidArgumentException('Background must be an object.');
        if (isset($background['mode']) && !in_array($background['mode'], ['theme','solid','gradient'], true)) {
            throw new InvalidArgumentException('Invalid background mode.');
        }
        self::backgroundPalette($background);
        foreach (['light', 'dark'] as $theme) {
            if (!array_key_exists($theme, $background)) continue;
            if (!is_array($background[$theme])) throw new InvalidArgumentException('Background theme must be an object.');
            self::backgroundPalette($background[$theme]);
        }
    }

    private static function backgroundPalette(array $background): void
    {
        foreach (['leftColor','rightColor'] as $key) {
            if (isset($background[$key]) && $background[$key] !== ''
                && (!is_string($background[$key]) || !preg_match('/^#(?:[a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/iD', $background[$key]))) {
                throw new InvalidArgumentException('Use a hexadecimal color or leave blank for the theme.');
            }
        }
        foreach (['leftImage','rightImage'] as $key) self::url($background[$key] ?? '');
        foreach (['position','width','imageX','imageY'] as $key) self::number($background, $key, 0, 100);
        self::number($background, 'angle', 0, 360);
        self::number($background, 'imageOpacity', 0, 1);
        self::number($background, 'imageScale', 1, 500);
        if (isset($background['imageFit']) && !in_array($background['imageFit'], ['cover','contain','manual'], true)) {
            throw new InvalidArgumentException('Invalid image fit.');
        }
    }

    private static function decoration(mixed $decoration): void
    {
        if (!is_array($decoration)) throw new InvalidArgumentException('Decoration must be an object.');
        self::booleans($decoration, ['enabled','orbits']);
        self::url($decoration['imageUrl'] ?? '');
        if (isset($decoration['icon']) && (!is_string($decoration['icon']) || strlen($decoration['icon']) > 200)) {
            throw new InvalidArgumentException('Invalid decoration icon.');
        }
        self::number($decoration, 'size', 24, 400);
        self::number($decoration, 'opacity', 0, 1);
        foreach (['x','y'] as $key) self::number($decoration, $key, 0, 100);
    }

    private static function texts(mixed $texts): void
    {
        if ($texts === null) return;
        if (!is_array($texts) || !array_is_list($texts) || count($texts) > 20) throw new InvalidArgumentException('Use up to 20 text blocks.');
        foreach ($texts as $block) {
            if (!is_array($block) || !is_string($block['text'] ?? null) || mb_strlen($block['text']) > 12000
                || !in_array($block['kind'] ?? 'body', ['eyebrow','title','body','caption','custom'], true)
                || !in_array($block['position'] ?? 'beforeActions', ['beforeActions','afterActions'], true)
                || !in_array($block['align'] ?? 'left', ['left','center','right'], true)) {
                throw new InvalidArgumentException('Invalid text block.');
            }
            self::number($block, 'marginBottom', 0, 120, true);
            self::number($block, 'safeWidth', 1, 100, true);
            self::number($block, 'fontSize', 12, 120, true);
            self::fontFamily($block, 'fontFamily');
            self::fontColors($block);
            self::booleans($block, ['showIcon']);
            self::url($block['iconImage'] ?? '');
            if (isset($block['icon']) && (!is_string($block['icon']) || strlen($block['icon']) > 200)) throw new InvalidArgumentException('Invalid text icon.');
        }
    }

    private static function fontColors(array $block): void
    {
        if (!array_key_exists('fontColor', $block)) return;
        $colors = $block['fontColor'];
        if (!is_array($colors) || array_diff(array_keys($colors), ['light', 'dark'])) throw new InvalidArgumentException('Font colors must be an object with light and dark values.');
        foreach (['light', 'dark'] as $theme) {
            if (!array_key_exists($theme, $colors)) continue;
            $color = $colors[$theme];
            if (!is_string($color) || ($color !== '' && !preg_match('/^#(?:[a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/iD', $color))) {
                throw new InvalidArgumentException('Use a hexadecimal font color or leave blank for the theme.');
            }
        }
    }

    public static function defaultStats(): array
    {
        return [
            ['id'=>'users', 'metric'=>'users', 'enabled'=>true, 'icon'=>'fas fa-users'],
            ['id'=>'discussions', 'metric'=>'discussions', 'enabled'=>true, 'icon'=>'far fa-comments'],
            ['id'=>'posts', 'metric'=>'posts', 'enabled'=>true, 'icon'=>'far fa-comment-dots'],
        ];
    }

    private static function stats(mixed $items): void
    {
        if ($items === null) return;
        if (!is_array($items) || !array_is_list($items) || count($items) > 12) throw new InvalidArgumentException('Use up to 12 statistics.');
        $ids = [];
        foreach ($items as $item) {
            if (!is_array($item) || !is_string($item['id'] ?? null) || !preg_match('/^[a-zA-Z0-9_-]{1,64}$/D', $item['id'])
                || in_array($item['id'], $ids, true)
                || !in_array($item['metric'] ?? null, ['users','discussions','posts','online','recentPosts','recentUsers','recentDiscussions','postType','tagDiscussions'], true)) {
                throw new InvalidArgumentException('Invalid statistic ID or metric.');
            }
            $ids[] = $item['id'];
            self::booleans($item, ['enabled']);
            foreach (['label','icon','postType','tag'] as $key) {
                if (isset($item[$key]) && (!is_string($item[$key]) || mb_strlen($item[$key]) > 200)) throw new InvalidArgumentException('Invalid statistic '.$key.'.');
            }
            if (isset($item['postType']) && !preg_match('/^[a-zA-Z0-9_-]{1,100}$/D', $item['postType'])) throw new InvalidArgumentException('Invalid post type.');
            self::number($item, 'days', 1, 365);
            self::number($item, 'minutes', 1, 60);
        }
    }

    public static function url(mixed $url): void
    {
        if (! is_string($url)) {
            throw new InvalidArgumentException('URLs must be strings.');
        }
        if ($url === '') {
            return;
        }
        if (preg_match('/[\x00-\x20\x7f\\\\]/', $url)
            || str_starts_with($url, '//')
            || (! str_starts_with($url, '/') && ! preg_match('#^https?://[^/]+#i', $url))
            || (preg_match('#^https?://#i', $url) && filter_var($url, FILTER_VALIDATE_URL) === false)) {
            throw new InvalidArgumentException('Use a local path beginning with / or an http(s) URL.');
        }
    }
}

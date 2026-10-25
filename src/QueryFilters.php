<?php

namespace EdgeInfinity\DiyHomepage;

use EdgeInfinity\DiyHomepage\Event\Searching;
use Flarum\Extension\ExtensionManager;
use Flarum\Locale\TranslatorInterface;
use Flarum\User\User;
use Illuminate\Contracts\Events\Dispatcher;

/** Translate Flarum 2 collection gambits before calling its structured-filter API. */
class QueryFilters
{
    public function __construct(
        private TranslatorInterface $translator,
        private ExtensionManager $extensions,
        private Dispatcher $events,
    ) {
    }

    public function forQuery(string $type, string $query, User $actor): array
    {
        // Keep q, including an empty parsed remainder: core uses its presence
        // when selecting the configured full-text driver, just as Store.find does.
        $filters = ['q' => $query];
        $rules = [];
        $keyValue = function (string $key, string $translation, string $value = '(.+)', bool $predicates = false) use (&$rules): void {
            $rules[] = [$this->translator->trans($translation).':'.$value, $key, $predicates, false];
        };
        $boolean = function (string $key, string $translation) use (&$rules): void {
            $rules[] = [$this->translator->trans('core.lib.gambits.group_keys.is').':('.$this->translator->trans($translation).')', $key, false, true];
        };

        if ($type === 'discussions') {
            $keyValue('author', 'core.lib.gambits.discussions.author.key');
            $keyValue('created', 'core.lib.gambits.discussions.created.key', '(\d{4}-\d\d-\d\d(?:\.\.(\d{4}-\d\d-\d\d))?)');
            if (!$actor->isGuest()) {
                $boolean('hidden', 'core.lib.gambits.discussions.hidden.key');
                $boolean('unread', 'core.lib.gambits.discussions.unread.key');
            }
            if ($this->extensions->isEnabled('flarum-tags')) {
                $keyValue('tag', 'flarum-tags.lib.gambits.discussions.tag.key', '(.+)', true);
            }
            foreach (['locked' => 'flarum-lock', 'sticky' => 'flarum-sticky'] as $key => $extension) {
                if ($this->extensions->isEnabled($extension)) $boolean($key, $extension.'.lib.gambits.discussions.'.$key.'.key');
            }
            if (!$actor->isGuest() && $this->extensions->isEnabled('flarum-subscriptions')) {
                $prefix = 'flarum-subscriptions.lib.gambits.discussions.subscription.';
                $rules[] = [$this->translator->trans('core.lib.gambits.group_keys.is').':('.
                    $this->translator->trans($prefix.'following_key').'|'.
                    $this->translator->trans($prefix.'ignoring_key').')', 'subscription', false, false];
            }
        } elseif ($type === 'users') {
            if (!$actor->isGuest() && $actor->hasPermission('user.editCredentials')) {
                $keyValue('email', 'core.lib.gambits.users.email.key');
            }
            $keyValue('group', 'core.lib.gambits.users.group.key');
            if (!$actor->isGuest() && $actor->hasPermission('user.suspend') && $this->extensions->isEnabled('flarum-suspend')) {
                $boolean('suspended', 'flarum-suspend.lib.gambits.users.suspended.key');
            }
        }

        // Match the browser registry's space tokenization, negation, scalar
        // overwrite and tag AND/OR arrays. Unrecognized syntax stays full text.
        $bits = explode(' ', $query);
        foreach ($rules as [$pattern, $key, $predicates, $boolean]) {
            foreach ($bits as $bit) {
                if (!preg_match('~^(-?)'.str_replace('~', '\~', $pattern).'$~iu', $bit, $matches)) continue;
                $filterKey = ($matches[1] === '-' ? '-' : '').$key;
                $value = $boolean ? true : $matches[2];
                if ($predicates) $filters[$filterKey][] = $value;
                else $filters[$filterKey] = $value;
                $position = strpos($query, $bit);
                if ($position !== false) $query = substr_replace($query, '', $position, strlen($bit));
            }
        }
        $filters['q'] = preg_replace('/\s+/u', ' ', trim($query));
        $event = new Searching($type, $actor, $filters);
        $this->events->dispatch($event);

        return $event->filters;
    }
}

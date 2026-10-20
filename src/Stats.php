<?php

namespace EdgeInfinity\DiyHomepage;

use Carbon\Carbon;
use Flarum\Discussion\Discussion;
use Flarum\Post\Post;
use Flarum\User\User;

class Stats
{
    public const ONLINE_PERMISSION = 'edgeinfinity-diy-homepage.viewOnlineCount';

    public static function canViewOnline(User $actor): bool
    {
        // Existing permission to see identities also permits seeing their count.
        return $actor->hasPermission(self::ONLINE_PERMISSION) || $actor->hasPermission('viewOnlineUsersWidget');
    }

    public function value(array $item, User $actor): ?int
    {
        $days = (int) ($item['days'] ?? 7);
        $since = Carbon::now()->subDays($days);
        return match ($item['metric']) {
            'users' => User::whereVisibleTo($actor)->count(),
            'discussions' => Discussion::whereVisibleTo($actor)->count(),
            'posts' => Post::whereVisibleTo($actor)->where('type', 'comment')->count(),
            'recentPosts' => Post::whereVisibleTo($actor)->where('type', 'comment')->where('created_at', '>=', $since)->count(),
            'recentUsers' => User::whereVisibleTo($actor)->where('joined_at', '>=', $since)->count(),
            'recentDiscussions' => Discussion::whereVisibleTo($actor)->where('created_at', '>=', $since)->count(),
            'postType' => Post::whereVisibleTo($actor)->where('type', $item['postType'] ?? 'comment')->count(),
            'tagDiscussions' => $this->tagCount($actor, $item['tag'] ?? ''),
            'online' => $this->onlineCount($actor, (int) ($item['minutes'] ?? 5)),
            default => null,
        };
    }

    private function onlineCount(User $actor, int $minutes): ?int
    {
        if (!self::canViewOnline($actor)) return null;
        $query = User::whereVisibleTo($actor)->where('last_seen_at', '>', Carbon::now()->subMinutes($minutes));
        if (!$actor->hasPermission('user.viewLastSeenAt')) {
            // Same privacy rule as FoF's online list: an opt-out must not be
            // inferable from the count. This counts members, never guest sessions.
            $query->where(fn ($query) => $query->whereNull('preferences')
                ->orWhereNull('preferences->discloseOnline')->orWhere('preferences->discloseOnline', true));
        }
        return $query->count();
    }

    private function tagCount(User $actor, string $slug): ?int
    {
        if (!resolve(\Flarum\Extension\ExtensionManager::class)->isEnabled('flarum-tags')) return null;
        return Discussion::whereVisibleTo($actor)->whereHas('tags', fn ($query) => $query->where('slug', $slug))->count();
    }
}

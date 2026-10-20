<?php

namespace EdgeInfinity\DiyHomepage;

use Flarum\Api\Client;
use Flarum\Extension\ExtensionManager;
use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Log\LoggerInterface;
use RuntimeException;

/** Page-scoped, permission-aware API documents, following core's Index payload. */
class InitialData
{
    public function __construct(
        private Client $api,
        private SettingsRepositoryInterface $settings,
        private LoggerInterface $logger,
        private ExtensionManager $extensions,
    ) {
    }

    public function forRequest(ServerRequestInterface $request): array
    {
        $actor = RequestUtil::getActor($request);
        $config = Config::decode($this->settings->get('edgeinfinity-diy-homepage.config'));
        $api = $this->api->withParentRequest($request)->withErrorHandling();
        $data = [];
        foreach ($config['widgets'] as $widget) {
            if (($widget['enabled'] ?? true) === false
                || (($widget['audience'] ?? 'all') === 'members' && $actor->isGuest())
                || (($widget['audience'] ?? 'all') === 'guests' && !$actor->isGuest())
                || ($widget['settings']['loadMode'] ?? 'preload') === 'async'
                || !in_array($widget['type'], ['discussions', 'users', 'stats'], true)) continue;
            try {
                $payload = match ($widget['type']) {
                    'discussions' => $this->discussions($api, $widget['settings'] ?? []),
                    'users' => $this->users($api, $widget['settings'] ?? []),
                    'stats' => $this->get($api, '/diy-homepage/stats', ['widget' => $widget['id']]),
                };
                $data[$widget['id']] = ['type' => $widget['type'], 'payload' => $payload];
            } catch (\Throwable $error) {
                // A failed widget can retry in the browser; it must not break the page.
                $this->logger->warning('Homepage widget preload failed: '.$widget['id'], ['exception' => $error]);
            }
        }
        return $data;
    }

    private function get(Client $api, string $path, array $params): array
    {
        $response = $api->withQueryParams($params)->get($path);
        if ($response->getStatusCode() >= 400) throw new RuntimeException('Homepage API returned '.$response->getStatusCode());
        return json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
    }

    private function ids(array $settings): array
    {
        return array_slice(array_values(array_unique(array_filter(preg_split('/[\s,]+/', trim($settings['ids'] ?? '')),
            static fn ($id) => ctype_digit($id)))), 0, 20);
    }

    private function limit(array $settings): int
    {
        return max(1, min(20, (int) ($settings['limit'] ?? 5)));
    }

    private function discussions(Client $api, array $settings): array
    {
        $selected = $this->ids($settings);
        $limit = $this->limit($settings);
        $include = ['user', 'lastPostedUser'];
        if ($this->extensions->isEnabled('flarum-tags')) $include[] = 'tags';
        if (($settings['showExcerpt'] ?? true) !== false) {
            $include[] = $this->settings->get('fof-synopsis.excerpt-type') === 'last' ? 'lastPost' : 'firstPost';
            if ($settings['featured'] ?? false) $include[] = 'firstPost';
        }
        $params = [
            'include' => implode(',', array_unique($include)),
            'sort' => in_array($settings['sort'] ?? '', ['-lastPostedAt','-createdAt','-commentCount'], true) ? $settings['sort'] : '-lastPostedAt',
            'page' => ['limit' => count($selected) ?: $limit, 'total' => 0],
        ];
        $records = [];
        $included = [];
        $append = static function (array $payload) use (&$records, &$included, $limit): void {
            foreach ($payload['data'] ?? [] as $record) {
                if (count($records) >= $limit) break;
                $records[$record['id']] = $record;
            }
            foreach ($payload['included'] ?? [] as $record) $included[$record['type'].':'.$record['id']] = $record;
        };
        if ($selected) {
            $pinned = $this->get($api, '/discussions', $params + ['filter' => ['id' => implode(',', $selected)]]);
            usort($pinned['data'], static fn ($a, $b) => array_search($a['id'], $selected) <=> array_search($b['id'], $selected));
            $append($pinned);
        }
        $offset = 0;
        while (count($records) < $limit) {
            $query = $params;
            $query['page'] = ['limit' => $limit + count($records), 'offset' => $offset, 'total' => 0];
            if (!empty($settings['query'])) $query['filter']['q'] = $settings['query'];
            $payload = $this->get($api, '/discussions', $query);
            $append($payload);
            if (empty($payload['data']) || empty($payload['links']['next'])) break;
            $offset += count($payload['data']);
        }
        return ['data' => array_values($records), 'included' => array_values($included)];
    }

    private function users(Client $api, array $settings): array
    {
        $selected = array_slice($this->ids($settings), 0, $this->limit($settings));
        if (!$selected) {
            $params = [
                'page' => ['limit' => $this->limit($settings), 'total' => 0],
                'sort' => in_array($settings['sort'] ?? '', ['-joinedAt','-commentCount','-discussionCount'], true) ? $settings['sort'] : '-joinedAt',
            ];
            if (!empty($settings['query'])) $params['filter']['q'] = $settings['query'];
            return $this->get($api, '/users', $params);
        }
        $records = [];
        $included = [];
        foreach ($selected as $id) {
            $response = $api->withQueryParams([])->get('/users/'.$id);
            if (in_array($response->getStatusCode(), [403, 404])) continue;
            if ($response->getStatusCode() >= 400) throw new RuntimeException('Homepage user API failed.');
            $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
            $records[] = $payload['data'];
            foreach ($payload['included'] ?? [] as $record) $included[$record['type'].':'.$record['id']] = $record;
        }
        return ['data' => $records, 'included' => array_values($included)];
    }
}

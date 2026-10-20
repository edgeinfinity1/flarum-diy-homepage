<?php

namespace EdgeInfinity\DiyHomepage\Api;

use EdgeInfinity\DiyHomepage\Config;
use EdgeInfinity\DiyHomepage\Stats;
use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\Locale\TranslatorInterface;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class StatsController implements RequestHandlerInterface
{
    public function __construct(private SettingsRepositoryInterface $settings, private Stats $stats, private TranslatorInterface $translator)
    {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertCan('viewForum');

        $id = $request->getQueryParams()['widget'] ?? null;
        $config = Config::decode($this->settings->get('edgeinfinity-diy-homepage.config'));
        $widget = null;
        foreach ($config['widgets'] as $candidate) {
            if ($candidate['type'] !== 'stats' || ($id !== null && $candidate['id'] !== $id)
                || ($candidate['enabled'] ?? true) === false
                || (($candidate['audience'] ?? 'all') === 'members' && $actor->isGuest())
                || (($candidate['audience'] ?? 'all') === 'guests' && !$actor->isGuest())) continue;
            $widget = $candidate;
            break;
        }
        // Only saved, visible widget definitions may select expensive queries.
        if (!$widget) throw new \Flarum\Http\Exception\RouteNotFoundException();
        $items = [];
        $memo = [];
        foreach ($widget['settings']['stats'] ?? Config::defaultStats() as $item) {
            if (($item['enabled'] ?? true) === false) continue;
            $key = json_encode([$item['metric'], $item['days'] ?? 7, $item['minutes'] ?? 5, $item['tag'] ?? '', $item['postType'] ?? 'comment']);
            if (!array_key_exists($key, $memo)) $memo[$key] = $this->stats->value($item, $actor);
            if ($memo[$key] === null) continue; // Omit protected metrics, not a misleading zero.
            $items[] = [
                'id' => $item['id'],
                'label' => ($item['label'] ?? '') !== '' ? $item['label'] : $this->translator->trans('edgeinfinity-diy-homepage.forum.stats.'.$item['metric'], [
                    'days'=>$item['days'] ?? 7, 'minutes'=>$item['minutes'] ?? 5, 'type'=>$item['postType'] ?? 'comment', 'tag'=>$item['tag'] ?? '',
                ]),
                'icon' => $item['icon'] ?? 'fas fa-chart-simple',
                'count' => $memo[$key],
            ];
        }
        return new JsonResponse(['items' => $items]);
    }
}

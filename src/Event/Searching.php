<?php

namespace EdgeInfinity\DiyHomepage\Event;

use Flarum\User\User;

/** Third-party gambits may convert the remaining q into their API filters. */
class Searching
{
    public function __construct(
        public readonly string $type,
        public readonly User $actor,
        public array $filters,
    ) {
    }
}

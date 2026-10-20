<?php

require __DIR__.'/bootstrap.php';
require_once __DIR__.'/../src/Config.php';

use EdgeInfinity\DiyHomepage\Config;
use Symfony\Component\Yaml\Yaml;

function translations(array $tree, string $prefix = ''): array
{
    $result = [];
    foreach ($tree as $key => $value) {
        $name = $prefix.$key;
        if (is_array($value)) {
            $result += translations($value, $name.'.');
        } elseif (is_string($value) && trim($value) !== '') {
            $result[$name] = $value;
        } else {
            throw new RuntimeException('Empty or invalid translation: '.$name);
        }
    }
    ksort($result);
    return $result;
}

function placeholders(string $message): array
{
    preg_match_all('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', $message, $matches);
    $names = array_unique($matches[1]);
    sort($names);
    return $names;
}

$root = dirname(__DIR__);
$english = translations(Yaml::parseFile($root.'/locale/en.yml'));
foreach (glob($root.'/locale/*.yml') as $file) {
    $locale = translations(Yaml::parseFile($file));
    if (array_keys($locale) !== array_keys($english)) {
        throw new RuntimeException('Translation keys differ from English: '.basename($file));
    }
    foreach ($english as $key => $message) {
        if (placeholders($message) !== placeholders($locale[$key])) {
            throw new RuntimeException('Translation parameters differ: '.basename($file).' / '.$key);
        }
    }
}

// The supplied layout must use local routes and translated, generic defaults.
$config = Config::validate(file_get_contents($root.'/resources/default.json'));
foreach ($config['widgets'] as $widget) {
    foreach (['name', 'title'] as $field) {
        $key = 'edgeinfinity-diy-homepage.lib.widgets.'.$widget['type'].'.'.$field;
        if (!isset($english[$key])) {
            throw new RuntimeException('Missing English widget default: '.$key);
        }
    }
}
$defaults = file_get_contents($root.'/resources/default.json');
if (preg_match('/https?:\/\/|\p{Han}/u', $defaults)) {
    throw new RuntimeException('The default layout must not contain an external site or untranslated Chinese content.');
}
echo count($english)." translation keys checked across all locales; parameters and generic default layout passed.\n";

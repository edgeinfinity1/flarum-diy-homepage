<?php

// A standalone checkout uses its own dependencies. A path installation can opt in
// to the host forum's vendor directory without depending on its directory depth.
$vendorDirectory = getenv('FLARUM_VENDOR_DIR') ?: __DIR__.'/../vendor';
$autoload = rtrim($vendorDirectory, '/\\').'/autoload.php';
if (!is_file($autoload)) {
    fwrite(STDERR, "Dependencies not found. Run composer install, or set FLARUM_VENDOR_DIR to a Flarum vendor directory.\n");
    exit(1);
}
require_once $autoload;

// Test this checkout even when dependencies come from an older path installation.
$candidateLoader = new Composer\Autoload\ClassLoader();
$candidateLoader->addPsr4('EdgeInfinity\\DiyHomepage\\', __DIR__.'/../src');
$candidateLoader->register(true);

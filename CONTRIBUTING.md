# Contributing

Use PHP 8.3 or later in the PHP 8 series, Composer 2, Node.js 24 and npm. A running Flarum 2.0.2 or later 2.x installation is needed for browser review. FoF Widgets Core is optional.

From a standalone checkout:

```sh
composer install
composer validate --strict
composer test
node --test .github/scripts/update-packagist.test.mjs
cd js
npm ci
npm run build
```

The PHP tests do not use a database. Configuration tests can run with `php tests/config.php` alone. Middleware and translation tests need Composer dependencies. For a Composer path installation, use the host forum's dependencies explicitly instead of installing a second vendor tree:

```sh
FLARUM_VENDOR_DIR=/absolute/path/to/forum/vendor composer test
```

Rebuild and commit all four `js/dist` files after changing JavaScript. The lockfile pins build dependencies; dependency updates should be intentional. LESS and locale changes require recompiling the target forum's assets as well. CI checks PHP 8.3/8.4, tests, translation keys and parameters, whether a clean frontend build matches the committed assets, and release automation behavior.

Keep built-in defaults generic and translate visible text through the extension's namespace. Add matching keys and parameters to both supplied locales. Forum-specific copy, URLs, IDs, branding and provider workarounds belong in forum settings or a separate extension. Do not commit exported forum configurations, credentials, uploads or generated forum assets.

For changes affecting behavior, review guest/member navigation, administrator saves, restricted data, light/dark and high-contrast themes, mobile spacing and loading states. Check the FoF bridge when changing shared registry or widget rendering behavior. Include relevant test results and compatibility limits in the change description.

The [full documentation](docs/DOCUMENTATION.md) covers configuration, widget registration and the FoF bridge. Keep [README.md](README.md) and [README.zh-CN.md](README.zh-CN.md) concise and aligned when changing user-facing features.

See [RELEASING.md](RELEASING.md) for packaging and versioning.

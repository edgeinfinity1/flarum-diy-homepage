# Releasing

The extension is distributed through Composer. The npm package is private and exists only to build the frontend. Composer derives package versions from Git tags; do not add a fixed `version` field to `composer.json`.

Before tagging:

1. Update `CHANGELOG.md`, the version in `js/package.json` and its lockfile, and any version examples in the README.
2. Run `composer validate --strict` and `composer test` as described in [CONTRIBUTING.md](CONTRIBUTING.md).
3. Run `npm ci` and `npm run build` in `js/`. Commit the source and all four compiled `js/dist` files together.
4. Review the diff for forum-specific settings, credentials, paths, branding or test fixtures. Keep exported layouts and deployment records outside this repository.
5. Review the package on a compatible Flarum installation, including guest/member routes, permissions, English defaults, themes and any optional providers used in the release.

Create an annotated version tag on the reviewed commit. For example, use `git tag -a v0.1.0-beta.1 -m "DIY Homepage 0.1.0-beta.1"` for the initial beta. Future releases need new version tags; do not move an already published tag.

To inspect a distribution without publishing it:

```sh
git archive --format=zip --prefix=diy-homepage/ --output=../diy-homepage-0.1.0-beta.1.zip v0.1.0-beta.1
```

The archive keeps PHP, LESS, translations, views, generic defaults, frontend source and compiled assets, Composer metadata, README, changelog and license. `.gitattributes` excludes CI, tests and contributor-only files from Git-generated distributions. Install from a full clone when working on the extension; an installation from a distribution does not contain the development tests.

The repository intentionally has no assumed hosting URL. When a public repository exists, configure its remote, add real source/issue links to Composer metadata, and push the reviewed commit and tag. Register the repository with Packagist and verify that the beta tag is recognized before documenting a public `composer require` command as available. Those are publication steps, separate from preparing a local release.

Do not include third-party provider patches in this package. Document provider compatibility separately and distribute any provider modifications through their own maintenance workflow.

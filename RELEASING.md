# Releasing

The extension is distributed through Composer as [edgeinfinity/diy-homepage](https://packagist.org/packages/edgeinfinity/diy-homepage). The first public release is 0.1.0. The npm package remains private and is only used to build the included frontend assets. Composer takes its version from Git tags; do not add a fixed `version` to `composer.json`.

The [full release and automation guide](docs/DOCUMENTATION.md#publishing-releases-and-packagist-automation) documents the Actions secret/variable, publishing, retrying and token rotation.

Before each release:

1. Update `CHANGELOG.md`, the version in `js/package.json` and both root version fields in `js/package-lock.json`. Update version examples when necessary.
2. Run `composer validate --strict`, `composer test`, and `node --test .github/scripts/update-packagist.test.mjs` in a full checkout. See [CONTRIBUTING.md](CONTRIBUTING.md).
3. Run `npm ci` and `npm run build` in `js/`. Commit any changes to all four compiled `js/dist` files with their source.
4. Review the diff for forum-specific configuration, credentials, branding or fixtures. Review behavior changes on a compatible Flarum installation.
5. Push the reviewed commit and wait for **Checks**. Create a new annotated tag, then publish a GitHub Release using that tag. **Publish to Packagist** validates the tagged tree, requests an update and verifies the indexed commit.

For the next patch release, the tag commands would be:

```sh
git tag -a v0.1.3 -m "DIY Homepage 0.1.3"
git push origin v0.1.3
```

Publishing the corresponding GitHub Release starts synchronization. A bare tag push runs checks but does not trigger that workflow. For retries, use **Actions → Publish to Packagist → Run workflow** and enter the existing tag. Never move a published tag. The local preview tag `v0.1.0-beta.1` predates the public release and remains unchanged.

Inspect a distribution without publishing it:

```sh
git archive --format=zip --prefix=diy-homepage/ --output=../diy-homepage-review.zip HEAD
```

The archive includes runtime code, frontend source and compiled assets, generic defaults, translations, both READMEs, full documentation, screenshots and license. `.gitattributes` excludes CI and tests from Git-generated distributions. Use a full clone for development. Do not include third-party provider patches in this package.

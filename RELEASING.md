# Releasing

The extension is distributed through Composer. The npm package is private and exists only to build the frontend. Composer derives package versions from Git tags; do not add a fixed `version` field to `composer.json`.

Before tagging:

1. Update `CHANGELOG.md`, the version in `js/package.json` and its lockfile, and any version examples in both READMEs and the full documentation.
2. Run `composer validate --strict` and `composer test` as described in [CONTRIBUTING.md](CONTRIBUTING.md).
3. Run `npm ci` and `npm run build` in `js/`. Commit the source and all four compiled `js/dist` files together.
4. Review the diff for forum-specific settings, credentials, paths, branding or test fixtures. Keep exported layouts and deployment records outside this repository.
5. Review the package on a compatible Flarum installation, including guest/member routes, permissions, English defaults, themes and any optional providers used in the release.

Create an annotated version tag on the reviewed commit after choosing its version. For example, the next beta could use `git tag -a v0.1.0-beta.2 -m "DIY Homepage 0.1.0-beta.2"`. Future releases need new version tags; do not move an already published tag.

To inspect a distribution without publishing it:

```sh
git archive --format=zip --prefix=diy-homepage/ --output=../diy-homepage-review.zip HEAD
```

The archive keeps PHP, LESS, translations, views, generic defaults, frontend source and compiled assets, Composer metadata, both language READMEs, `docs/DOCUMENTATION.md`, changelog, contributor/release guides and license. `.gitattributes` excludes CI, tests and editor/repository configuration from Git-generated distributions. All local documentation links remain usable in the archive. Install from a full clone when working on the extension; an installation from a distribution does not contain the development tests.

The public repository is https://github.com/edgeinfinity1/flarum-diy-homepage. Its `main` branch is uploaded for review, and Composer metadata links to its source, issues and documentation. Packagist registration and release tags require a separate release decision. The existing local `v0.1.0-beta.1` tag predates fixes on `main` and is not uploaded as part of repository preparation; choose a new version for the reviewed release and keep old tags unchanged.

After release approval, push the reviewed commit and its new annotated tag, register the repository with Packagist, and verify that Packagist recognizes the tag. Only then replace the GitHub VCS/development installation instructions in both READMEs and the full documentation with the tested tagged-package command. Repository upload does not publish an npm package or register a Composer package.

Do not include third-party provider patches in this package. Document provider compatibility separately and distribute any provider modifications through their own maintenance workflow.

# Changelog

## Unreleased

## 0.1.0 - 2026-10-21

First stable release on Packagist, including the original widget editor and all preview fixes.

- Publish version tags through GitHub Releases, with automated checks, Packagist synchronization and verification of the indexed commit.

- Anchor animated statistics at the right edge so new digits extend to the left while the final width and accessible value stay stable.
- Add English and Simplified Chinese frontend and admin screenshots captured from a running Flarum installation with temporary demonstration content.

- Add concise English and Simplified Chinese READMEs with language links, move the full reference into `docs/DOCUMENTATION.md`, and add GitHub source, issue and documentation metadata.

- Prevent homepage discussion tags from being vertically clipped by floating-list overflow and site-wide fade masks, including on hover.

- Keep imported FoF widgets available on the homepage when removed from FoF's layout, while preserving provider availability and permission checks.

## 0.1.0-beta.1 (local preview)

Initial beta for Flarum 2.0.2 and later 2.x releases.

- Configurable homepage, guest landing route, page hero and four widget regions.
- Banner, image, notice, discussion, user, statistics, links and search widgets.
- Visual editor with JSON import/export, audience rules and collapsible controls.
- Core discussion and user components, excerpts and permission-aware data loading.
- Optional two-way FoF Widgets Core bridge, without a required FoF dependency.
- Theme-aware backgrounds, gradients, images, typography, spacing and safe widths.
- Data preloading, stable loading placeholders and optional statistics animation.
- Separate online-count permission that respects hidden online status.
- English and Simplified Chinese translations; generic defaults inherit forum branding.
- Compiled frontend assets, configuration and routing tests, and release checks.

This preview tag was used for local testing and was not published to Packagist. Version 0.1.0 is the first public release.

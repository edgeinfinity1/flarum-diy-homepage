# Changelog

## Unreleased

- Support per-token JSON-string defaults such as `{username, "Guest"}`, preserving legacy guest labels, literal escaping and single-pass plain-text rendering.

- Add everyone / disabled / guests-only root homepage modes while preserving existing installations and the /home alias.
- Support escaped, single-pass display-text variables for usernames, display names and forum text.
- Add explicit primary/secondary action styles, line/blank divider widgets with normal headings, independent statistics number/label fonts, and optional bottom padding/gap removal.
- Center title icons and remove ineffective imported-widget and background-image controls; clarify the optional Friends of Flarum Widgets integration.
- Preserve existing layouts, default button styles, typography and spacing; add server/client regressions and bilingual documentation.

尚未发布：新增首页三态、纯文本变量、按钮色调、分割微件、统计字体和底部间距开关；修复图标对齐并清理无效控件。旧配置兼容，默认外观保持。


## 0.1.4 - 2026-10-26

- Fix inconsistent discussion/user collection search on refresh by translating native Flarum 2 search gambits into server API filters; queried collections honor the configured preload mode.
- Keep enable, reorder, duplicate and remove controls visible in collapsed widget headers.
- Organize widget settings in accessible per-widget tabs, with keyboard navigation and a scrollable strip on narrow screens.
- Preserve the existing configuration schema and saved values.

## 0.1.3 - 2026-10-23

- Limit the top Flarum banner switch to the DIY homepage. Disabling it no longer hides banners on All Discussions or tag discussion pages, including during SPA navigation.
- Clarify the homepage-only scope in the English and Simplified Chinese setting help and documentation.

## 0.1.2 - 2026-10-22

- Add a default-on setting to show or hide the Flarum banner on discussion index pages and the DIY homepage.
- Let numeric provider fields declare their own editor range and step.
- Add a configuration-only region for fully editable instances that stay off the homepage and remain available in FoF's widget store.
- Preserve each exported instance's heading style instead of forcing FoF headings; duplicate into configuration only for independent content and appearance.
- Add a theme-color field for external widget providers and opt-in loading-height controls.
- Add the official discussion and donation links to the standard admin extension header alongside the existing source and documentation links.
- Point the author link to the maintainer's GitHub profile and the website link to the project forum.

## 0.1.1 - 2026-10-21

- Restore core's fixed discussion-statistics column so rows with counts of different lengths share a leading edge.
- Keep large view counts on one line by excluding numeric statistics from the widget's general text wrapping.
- Inherit core's mobile statistics alignment instead of forcing the items to the right.
- Verify publication through Composer's P2 index to avoid the package-details API's twelve-hour cache, and use the selected workflow's scripts when retrying an immutable release tag.

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

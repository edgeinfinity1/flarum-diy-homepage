# DIY Homepage documentation

[English overview](../README.md) · [简体中文简介](../README.zh-CN.md)

This reference covers configuration, widget behavior, permissions, integrations and development for DIY Homepage on Flarum 2. Start with the README for the feature overview and a short setup guide. Version 0.1.0 is the first stable release, available on [Packagist](https://packagist.org/packages/edgeinfinity/diy-homepage). The package targets Flarum `^2.0.2` and PHP `^8.3`.

## Contents

- [Screenshots](#screenshots)
- [Requirements and installation](#requirements-and-installation)
- [Routes and layout](#routes-and-layout)
- [Built-in widgets](#built-in-widgets)
- [Backgrounds, text and decoration](#backgrounds-text-and-decoration)
- [Statistics and online privacy](#statistics-and-online-privacy)
- [Configuration format](#configuration-format)
- [Registering another widget type](#registering-another-widget-type)
- [FoF Widgets Core bridge](#fof-widgets-core-bridge)
- [Development](#development)
- [Publishing releases and Packagist automation](#publishing-releases-and-packagist-automation)
- [License](#license)

## Screenshots

The READMEs include [English](../README.md#screenshots) and [Simplified Chinese](../README.zh-CN.md#实机截图) galleries covering the desktop homepage in light/dark themes, the mobile layout, the admin layout editor and separate light/dark background controls. See [screenshot notes](screenshots/README.md) for the capture environment and demonstration content.

## Requirements and installation

- PHP 8.3 or later in the PHP 8 series; Flarum `^2.0.2`.
- Optional: `fof/forum-widgets-core`. The bridge was exercised with Widgets Core 2.0.2.
- Compiled `js/dist` assets are included. Node.js is needed only for development.

Install the stable package from Packagist in your Flarum directory:

```sh
composer require edgeinfinity/diy-homepage:"^0.1.1"
php flarum cache:clear
```

The `^0.1.1` constraint accepts compatible 0.1.x updates. To update within that range, back up your forum and exported layout, then run `composer update edgeinfinity/diy-homepage --with-dependencies` and clear Flarum's cache. If you previously added the temporary GitHub VCS repository for evaluation, remove it with `composer config --unset repositories.diy-homepage` before switching to the stable constraint. Node.js is not required for installation.

Enable **DIY Homepage** in the administration panel, then open its extension settings. A generic five-widget layout is supplied. Changes to the visual editor take effect after **Save Changes**; reload open forum pages to load the new configuration.

## Routes and layout

`/home` always opens the homepage. Its navigation item appears before All Discussions. The navigation label, page-hero heading/subtitle and sticky sidebar are configurable. The hero uses Flarum's `Hero` component and `WelcomeHero` styling. A blank heading falls back to the navigation label; a custom heading does not change the navigation or browser tab title. Its optional heading icon accepts Font Awesome classes (default `fas fa-house`) or an image URL, with a separate visibility switch. Its plain-text subtitle supports line breaks and can be left empty; it is independent of the global welcome message and its dismiss preference.

The **Use the homepage as the guest landing page** switch is enabled by default. With Flarum's normal All Discussions default:

| Visitor | `/` | `/home` | `/all` |
| --- | --- | --- | --- |
| Guest, switch enabled | Homepage | Homepage | All Discussions |
| Signed in | All Discussions | Homepage | All Discussions |
| Guest, switch disabled | All Discussions | Homepage | All Discussions |

The extension preserves the forum's global default route for signed-in users and for guests when the switch is disabled. If a different default route is configured, that route retains its normal behavior. Do not assign `/home` as the global default if you want a separate signed-in landing page. Avoid enabling two extensions that claim `/home` or independently replace the guest default.

The `fullWidth` region sits below the hero and spans the left navigation, main and right columns. The existing `top` region, labeled **Upper**, spans the main and right columns. Existing saved `top` widgets keep their placement. On smaller screens the regions stack in `fullWidth`, `top`, `main`, `sidebar` order. Desktop widget widths follow Flarum's sidebar variables. The sticky right column reserves its scrollbar outside the widgets, shows it on hover or keyboard focus, and does not narrow the content when it appears. Themes may supply `--diy-home-scrollbar-thumb` and `--diy-home-scrollbar-track` for browsers using standard scrollbar colors, or style the WebKit scrollbar pseudo-elements. The extension uses theme colors and supports light and dark themes.

The page exposes `HomePage.providesIndexSidebar = true` for extensions that opt their existing sidebar controls into additional pages. Daily check-in controls remain the responsibility of their provider; the homepage does not implement rewards or duplicate its actions. FoF news can be placed in `fullWidth` by adding a FoF widget instance, subject to the provider's availability settings.

The **Page appearance** group controls the radius of native surfaces, authored controls and imported FoF standard content containers. Leave the radius blank to use Flarum's `--border-radius`, as used by the Start Discussion button; `0` gives square corners. Avatars, native circular discussion controls and decorative orbit shapes keep their own geometry. **Emphasized headings** is off by default and uses FoF's normal heading style; enabling it applies larger headings and colored icons to native and imported FoF headings. Each widget's **Heading style** can inherit this default or explicitly select **FoF** or **Emphasized**, allowing different styles in the main column and sidebar.

## Built-in widgets

All instances support a region, audience (`all`, `guests`, `members`) and enabled state. All native widgets, including banners, have a title, subtitle, optional heading link and an optional Font Awesome or image icon. `showTitle: false` removes their heading bar. A banner's heading bar is independent of its body text blocks, background and decoration. FoF provider-specific headings and options remain with the provider.

| Type | Settings and behavior |
| --- | --- |
| `banner` | Ordered text blocks, buttons, theme/solid/gradient backgrounds, optional images and an optional decoration. Legacy title/text/image settings remain readable. |
| `image` | Image URL, alternative text, optional destination and caption. Uses an existing image URL; does not upload files. |
| `notice` | Ordered plain-text blocks, `soft`/`plain`/`accent` tone and action buttons. |
| `discussions` | Core `DiscussionListItem`, including its avatar, controls and extension hooks, with search/IDs, sort, limit, an independent excerpt switch and optional featured first discussion. Visible selected IDs lead in the supplied order; search results fill remaining slots without duplicates. |
| `users` | Core Avatar, Tooltip, username helper and profile Link, with search/IDs, sort, limit and optional biography. Selected IDs retain the supplied order. |
| `stats` | Individually enabled and ordered totals, online members, recent activity, post-type and tag counts. Counts follow the current actor's visibility. |
| `links` | A collection of links and actions. |
| `search` | Discussion search form and configurable placeholder. |
| `fof` | An installed FoF widget selected by its registered ID. |

Discussion filters use the forum's normal search syntax. Additional search operators come from the forum's installed extensions. User search uses the standard users endpoint and requires its normal permissions; selected user IDs use the single-user endpoint. Permission failures produce a local empty/error state instead of exposing protected records.

Links/actions support `url`, `all`, `compose`, `signup` and `login`, with a label, optional Font Awesome/image icon and audience. The selected action determines the behavior: only `url` uses the stored URL, so switching an existing link to a command takes effect even if its previous URL is retained. URLs to another origin open a new tab with `noopener noreferrer`; the same behavior applies to heading links, linked images and external excerpt links. Internal action links keep Flarum navigation. Sign-up and login actions disappear for members. Compose uses Flarum's standard composer/login flow. Secondary actions, heading and read-more links use the sidebar's text color and hover color/background without an underline; heading/read-more arrows have a 1px left margin. Mobile homepage discussion lists retain the page's horizontal gutters.

Native data widgets (`discussions`, `users`, `stats`) default to `settings.loadMode: "preload"`. A direct homepage visit includes their API documents in the page payload, following Flarum's core Index and the official community homepage. These requests run as the current actor and preserve visibility, selected-ID ordering, filters and excerpt includes. `"async"` loads after the page instead, useful for expensive queries. Navigation from another page uses asynchronous loading in either mode. Preload failures leave the rest of the page available and allow the widget to retry asynchronously.

Loading states render the widget's background immediately. Discussions and users reserve rows according to their configured limit; statistics render their configured labels before counts arrive. An optional instance-level `loadingHeight` (0–3000px, blank or 0 for automatic) overrides the minimum reserved content height while loading. Imported FoF providers retain their own loading behavior and permissions. Their standard loading indicators reserve 120px initially, then reuse the measured height for the same widget, actor and viewport. Measurements are held in session storage for up to 30 minutes and never contain record data. Provider preloading remains controlled by FoF Widgets Core and the provider.

Statistics count up after loading with an ease-out animation. The units stay at the right edge as additional digits extend to the left. `settings.animateNumbers: false` disables it. The final width and accessible value remain stable during animation, and the browser's reduced-motion preference disables the animation automatically.

Discussion **Show post excerpts** (`settings.showExcerpt`) defaults to true, independently of **Feature the first discussion** (`settings.featured`). Disabling it removes both ordinary and featured summaries, including when another route has already loaded posts into the frontend store. Ordinary summaries reuse FoF Synopsis when enabled, including its first/last-post selection, tag overrides and member display preferences. Homepage queries explicitly load the selected source post, so a direct visit and a return from All Discussions show the same summaries. Without FoF Synopsis, a plain first-post excerpt is used. Ordinary rows keep the core list padding without an extra homepage separator or row padding.

Open native dropdowns lift their widget above subsequent surfaces. In the sticky sidebar, menus use fixed viewport positioning to escape the scroll clip, then close if scrolling moves their anchor or the viewport is resized. This keeps the core controls, focus handling and keyboard dismissal.

Editor text fields render plain text. Featured excerpts retain text, line breaks, paragraph boundaries, preformatted line breaks and HTTP(S) hyperlinks from the rendered first post, up to 360 text characters; media, embeds, scripts and hidden spoilers are omitted. The excerpt sits outside the discussion row's link so its links work independently. URLs configured in the editor accept forum paths beginning with `/`, or absolute HTTP(S) URLs. A local path is relative to the forum installation, including installations in a subdirectory. Script, data and protocol-relative configuration URLs are rejected.

## Backgrounds, text and decoration

Widget options are grouped into collapsible placement, heading, content, loading, actions, background and decoration sections. Each text block has its own collapsible editor, including typography controls when its style is Custom. Native widgets support `background.mode` of `theme`, `solid` or `gradient`. Theme mode keeps the original theme-derived appearance. Solid mode uses `leftColor` and an optional `leftImage`; gradient mode adds `rightColor` and `rightImage`. Colors accept hexadecimal notation and use theme colors when blank. `angle` (0–360 degrees), `position` (midpoint, 0–100%) and `width` (transition width, 0–100%) control the color and image blend. `imageX`, `imageY`, `imageFit` (`cover`/`contain`/`manual`) and `imageOpacity` control the images. In manual mode, `imageScale` (1–500, default 100) sets the minimum image width as a percentage of the background container width. Images retain their aspect ratio and always fill the background height; narrow or tall widgets crop the excess width instead of shrinking the image and leaving vertical gaps. Horizontal and vertical position select the visible area. Each theme has its own scale. Image values are existing URLs, with no upload or server-side fetch feature.

Text blocks offer small label, large title, body, caption and custom styles. Every text block has an independent `marginBottom` (0–120px); blank retains the existing 14px spacing, and the setting is independent of theme colors. Selecting **Custom** exposes a per-block `fontSize` (12–120px; blank uses 24px), `fontFamily` (a CSS font family list of up to 300 characters; blank inherits the site font), and `fontColor` palette with separate `light` and `dark` hexadecimal colors. The corresponding high-contrast theme uses the same color; a blank color inherits the default text color. This lets a banner's large title use a smaller size, a different font or theme-specific colors without affecting other text blocks. Font names must already be available on the site or in the browser; these settings do not download fonts. Existing banner `settings.titleFontSize` and `titleFontFamily` values remain a compatibility fallback for preset large-title blocks. The page-level WelcomeHero uses Flarum's core title styling and has no font settings.

Each text block also accepts `safeWidth` (1–100%, blank keeps the original layout). It limits that block to a proportion of the available width inside the widget padding, including on mobile, so text can stay on a readable side of a gradient or image. The safe area follows the block's left, center or right alignment. Banner `settings.actionsSafeWidth` provides the same independent control for the button group, following `actionsAlign`; long buttons wrap inside it. These widths are shared by all theme modes. Unconfigured banners retain their original decoration allowance on desktop and full content width on mobile.

Custom backgrounds have two editor columns. Store these color, image and geometry fields under `background.light` and `background.dark`; the shared `background.mode` selects the background type. The corresponding palette also applies to `light-hc` or `dark-hc`, and switches immediately with Flarum's theme. Missing per-theme fields inherit the original flat fields, so older configurations keep their appearance until edited. An explicit blank color uses the active theme color; a blank image removes that image. For example:

```json
{
  "mode": "gradient",
  "light": { "leftColor": "#f3dce7", "rightColor": "#e9f4ff", "angle": 115 },
  "dark": { "leftColor": "#182a37", "rightColor": "#352038", "angle": 250 }
}
```

Theme authors can target `.DiyHome-backgroundLayer--light` / `--dark` inside `.DiyHome-background`, and `.DiyHome-heroTitle` / `.DiyHome-heroIcon` for the page heading. Existing widget instance selectors (`data-home-widget`) remain available.

Banner and notice `settings.texts` are ordered blocks with `text`, `kind` (`eyebrow`, `title`, `body`, `caption`, `custom`), `position` (`beforeActions`, `afterActions`), `align` (`left`, `center`, `right`) and optional `showIcon`, `icon`, `iconImage`. Add, delete and reorder them independently. An explicit empty array removes all body text blocks, while the separate heading bar still follows `showTitle`. Without the array, legacy text/title settings remain readable; an explicitly empty legacy eyebrow stays hidden. Banner `settings.actionsAlign` controls the button group. A banner's legacy title becomes a text block when its texts are first edited.

Banner `settings.decoration` accepts `enabled`, `orbits`, `icon`, `imageUrl`, `size` (24–400px), `opacity` (0–1) and `x`/`y` (0–100% center coordinates). Disable the decoration to free the full content width. Empty icon and image values can leave only the optional outlines. Image icons take precedence over Font Awesome names throughout the native widgets.

Banners size their height from the text and actions plus padding, with no fixed minimum height. Background images and optional decorations do not force extra height; longer content expands the banner normally.

## Statistics and online privacy

Each stats instance has `settings.stats`, an ordered list of `{id, metric, enabled, label?, icon?, ...filters}`. Without this list, the three original totals remain enabled. Each item can be switched off, reordered, added or removed:

| Metric | Filter and meaning |
| --- | --- |
| `users`, `discussions` | Visible member/discussion totals. |
| `posts` | Visible `comment` posts, excluding event posts. |
| `online` | Members seen within `minutes` (1–60, default 5). Guest sessions are not counted. |
| `recentPosts` | Visible comments created in the last `days` (1–365, default 7). |
| `recentUsers` | Visible members who joined in the last `days`. |
| `recentDiscussions` | Visible discussions created in the last `days`. |
| `postType` | Visible posts of `postType` (default `comment`), using Flarum's registered post types. |
| `tagDiscussions` | Visible discussions in a tag selected by its `tag` slug; requires Flarum Tags. |

The online metric requires **View online member count (without identities)** (`edgeinfinity-diy-homepage.viewOnlineCount`) or FoF Online Users Widget's existing `viewOnlineUsersWidget` permission. The new permission grants only the count. Members who hide their online status are excluded unless the viewer has `user.viewLastSeenAt`. Unauthorized or unavailable metrics are omitted. Other metrics retain the models' visibility scopes; totals may differ from providers that include hidden discussions or event posts.

In Administration → Permissions, this count permission supports **Everyone**, **Members**, or specific groups. Select **Everyone** to show the count to guests as well. This does not grant access to the online member list or change members' privacy preferences.

`GET /api/diy-homepage/stats?widget=<instance-id>` selects only a saved, enabled stats instance visible to the current audience. It returns `{items: [{id, label, icon, count}]}`. Unknown or unavailable widget IDs return 404. Filters come from the saved configuration. The endpoint also requires normal forum-view permission.

## Configuration format

The editor can add, duplicate, remove and reorder widgets, move them between regions and edit their type-specific settings. The advanced JSON area supports copying/exporting the current configuration and importing a complete replacement: apply the JSON, then save.

```json
{
  "version": 1,
  "appearance": { "radius": "", "emphasizedTitles": false },
  "widgets": [
    {
      "id": "recent",
      "type": "discussions",
      "region": "main",
      "enabled": true,
      "audience": "all",
      "title": "Latest conversations",
      "subtitle": "Join a discussion",
      "icon": "far fa-comments",
      "titleStyle": "emphasized",
      "linkLabel": "View all",
      "linkUrl": "/all",
      "settings": {
        "query": "",
        "sort": "-lastPostedAt",
        "limit": 5,
        "featured": true,
        "showExcerpt": true
      }
    }
  ]
}
```

The JSON string is stored in `edgeinfinity-diy-homepage.config`. Other setting suffixes are `guest_home`, `sticky_sidebar`, `nav_label`, `hero_title`, `hero_subtitle`, `hero_show_icon`, `hero_icon` and `hero_icon_image`. Configuration limits are 128 KiB, 50 widget instances, 20 records/selected IDs per data widget, 20 text blocks and 12 actions/links or statistics per widget. Radius accepts 0–64px or a blank theme default. `titleStyle` accepts `inherit` (also the default when absent), `fof` or `emphasized`; `showExcerpt` must be a boolean when supplied. Instance IDs must be unique and contain at most 64 letters, numbers, underscores or hyphens. Statistics IDs must also be unique within their instance. Keep instance IDs stable: FoF references include them. The schema stays at version 1 and accepts the earlier layout format.

Settings saves are restricted by Flarum's normal administration permissions and validated on the server. Disabled widgets and widgets/actions for another audience are removed from the forum payload. Audience controls presentation; providers must still authorize their own data endpoints.

## Registering another widget type

Other extensions can register types on `app.diyHomepage` in **both** the forum and admin frontends. Declare this package as a Composer dependency so that its frontend registry loads first. Register before this extension's initializer at priority `-20`; priority `-10` is suitable. Use a namespaced type to avoid collisions.

Shared registration function:

```js
export function registerMessage(app, MessageWidget) {
  app.diyHomepage.register('acme:message', {
    label: () => 'Message',
    title: () => 'Community message',
    icon: 'far fa-comment',
    defaults: { message: '' },
    fields: [
      { key: 'message', type: 'textarea', label: () => 'Message' }
    ],
    component: MessageWidget
  });
}
```

Forum entrypoint:

```js
import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import { registerMessage } from '../common/registerMessage';

class MessageWidget extends Component {
  view() {
    return m('p', this.attrs.settings.message || '');
  }
}

app.initializers.add('acme/home-message', () => {
  registerMessage(app, MessageWidget);
}, -10);
```

The admin entrypoint imports `flarum/admin/app` and calls the same registration function with `null` as the component. Only the forum needs the rendering component. Translate labels in a real extension.

Registry methods are `register(type, definition)`, `get(type)` and `all()` (an array of `[type, definition]` pairs). Duplicate registrations throw. A definition accepts:

- `label()` and optional `title()` for the editor and default heading; `icon` for Font Awesome.
- JSON-safe `defaults` and a `fields` array for the admin editor.
- `component`, a Mithril component receiving `{ widget, settings }`.
- Optional `isAvailable(widget)` to suppress an unavailable instance on the forum.

Fields use `{ key, type, label, options?, help?, default? }`. Supported types: `text`, `textarea`, `url`, `number` (1–20), `boolean`, `select`, `links`, `fof`, plus the built-in `texts` and `stats` editors. A select's `options` maps values to strings or label functions. Field labels may be strings or functions. A boolean field's `default` determines its editor state when the setting is absent; it does not write a value until edited. A links field edits the action/link schema described above. Custom JSON-safe settings are preserved; built-in property names retain their validation rules. Providers should validate their additional options and handle loading, empty and error states in their components. Unregistered types remain in saved configuration and are hidden on the forum until their provider is available.

## FoF Widgets Core bridge

Both directions are supported when Widgets Core is enabled:

1. Add a `fof` instance in the homepage editor and select a registered FoF widget. It uses the provider's own component, state and availability checks. FoF widget-specific configuration and permissions remain with its provider. Providers that require another page's state may need their own homepage adaptation.
2. Each enabled native homepage instance is registered in FoF's available-widget store as `edgeinfinity-diy-homepage:home-<instance-id>`. Place it through FoF's editor to render the same configured instance on other supported pages. Refresh the editor after changing its homepage configuration. Each export is unique in FoF's layout.

The homepage configuration and FoF placement configuration are independent. Removing a provider from FoF's layout does not hide an existing homepage import; disable or remove that import in the homepage editor separately. Removing or renaming a native homepage instance leaves any old FoF placement reference inactive; remove that reference in FoF's editor. FoF-import instances are never exported back into FoF, preventing recursive bridges. FoF's automatic top/bottom/right sections are suppressed on the homepage so that its own regions determine placement; existing left navigation is preserved. Widget availability and the installed provider's permissions still apply.

The adapter includes a scoped compatibility adjustment for FoF 2.0.2's editor so that unique exports starting in the store can be dragged into a placement.

## Development

From `js/`, run `npm ci` and `npm run build` (or `npm run dev` while developing). Recompile Flarum's frontend assets using the target forum's normal workflow after changing JS or LESS. Rebuild and reload both frontends after registry changes.

From a full source checkout, run `composer install`, `composer validate --strict` and `composer test`. The tests cover configuration validation, guest-route middleware and locale/default resources, without a database. A path installation can use the host forum's dependencies with `FLARUM_VENDOR_DIR=/absolute/path/to/forum/vendor composer test`. Configuration tests alone need no Composer dependencies: `php tests/config.php`.

See [CONTRIBUTING.md](../CONTRIBUTING.md) and [RELEASING.md](../RELEASING.md) in a full Git checkout for build, CI and release procedures. Development-only files are omitted from distribution archives. Integration review also needs a running forum: guest/member routes, admin saves, data permissions, themes, responsive widths and the optional FoF bridge.

No database migration or custom table is created. Disabling the extension removes its routes and restores the core default-route behavior while retaining its settings. Export the layout before uninstalling. Version 0.1.1 has been verified on Flarum 2.0.2; review compatibility with your theme and widget providers before deployment.

## Publishing releases and Packagist automation

Composer derives the package version from Git tags. Keep `composer.json` free of a fixed `version` field. The first public version is `v0.1.0` (Composer version `0.1.0`); use a new immutable tag for each later release. The private npm package only builds the included frontend assets and is not published to npm.

### One-time configuration

The repository is registered as [edgeinfinity/diy-homepage](https://packagist.org/packages/edgeinfinity/diy-homepage). Its GitHub Actions configuration uses:

| Actions setting | Kind | Purpose |
| --- | --- | --- |
| `PACKAGIST_USERNAME` | Repository variable | Packagist account that maintains this package; configured as `edgeinfinity` in the upstream repository. |
| `PACKAGIST_TOKEN` | Repository secret | API token belonging to that account, authorized to update the package. |

Manage these under **Settings → Secrets and variables → Actions**. Tokens belong in encrypted Secrets; do not put them in workflow YAML, Git URLs or documentation. To rotate a token, update the existing secret. A fork with another package name/repository must register its own package and adjust the publication script's package name and canonical repository URL.

### Publish a new version

1. Update `CHANGELOG.md`, `js/package.json` and the root package version in `js/package-lock.json`. Keep both lockfile version fields consistent. Update installation examples when the supported version range changes.
2. Run the checks in [CONTRIBUTING.md](../CONTRIBUTING.md), rebuild the frontend if needed, and commit the release changes. Check the installation's guest/member routes, permissions and optional providers when behavior changes.
3. Push the reviewed commit to `main` and wait for **Checks** to pass. Create and push an annotated version tag on that commit, for example `git tag -a v0.1.2 -m "DIY Homepage 0.1.2"` followed by `git push origin v0.1.2`.
4. Open **Releases → Draft a new release** on GitHub, select that existing tag, add release notes and click **Publish release**. Drafts do not trigger synchronization. Publishing a prerelease also triggers it; the supported tag suffixes are numbered alpha/beta/rc versions such as `v0.2.0-beta.1`.
5. Check the **Publish to Packagist** workflow and the version on the package page. The workflow reruns the PHP, translation, frontend-build and publication-script checks against the selected tag before requesting an update. It then waits until Packagist's Composer P2 index reports that version at the exact tagged commit. A successful HTTP update request alone does not mark the job successful. The package-details API is cached for up to twelve hours, so the workflow verifies the installation index instead.

`.github/workflows/packagist.yml` runs on `release.published`. Pushing a Git tag alone runs the normal checks; publish its GitHub Release to start this synchronization workflow. The workflow uses read-only GitHub permissions, supplies Packagist credentials only to its update step, and sends them in an HTTPS authorization header. No token appears in a request URL. Packagist reads the source and distribution from the public GitHub repository.

### Retry and troubleshoot

Under **Actions → Publish to Packagist → Run workflow**, choose the default branch and enter an existing version tag, such as `v0.1.0`. This reruns validation and synchronization without creating another release or moving a tag. The retry uses the default branch's current publication scripts while checking the original tagged package, so automation fixes also apply to older releases. You can rerun a failed release workflow when its automation has not changed; use the default-branch manual entry after an automation fix. Keep published tags unchanged; ship a new patch release to correct published package code.

A missing variable/secret, tag/frontend version mismatch, failed check or HTTP authentication error stops publication. Check the Actions settings and Packagist package ownership for HTTP 401/403. Temporary service errors are retried; if indexing takes longer than the verification window, inspect Packagist and retry the workflow. After success, `composer show edgeinfinity/diy-homepage --all` should list the new version.

Publishing updates Composer's package index. It does not deploy code or change settings on forums using this extension; administrators update their own installations with Composer.

## License

MIT. See [LICENSE](../LICENSE).

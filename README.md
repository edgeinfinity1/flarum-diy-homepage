# DIY Homepage

**English** | [简体中文](README.zh-CN.md)

I initially built this extension to replicate the home page feature of https://discuss.flarum.org , but ended creating something even better.

So I decided to open-source this extension for everyone who want to have a beautiful homepage for their flarum deployment.

The most outstanding features of it are **Widget-ized** and **Highly customizable**, you can implement various of modern frontend aesthetic designs without having to touch the code.

This extension is also running on my own deployment: https://forum.monika.love

Notice: This extension was made with massive help of AI, but under careful human supervise and field-tested.

> Anything below this point was written by AI

Build a configurable homepage for Flarum 2. Arrange widgets, content and appearance in a visual admin editor while keeping your forum's existing left navigation.

## Features

- Four layout regions: full width, upper, main and sidebar, with an optional sticky sidebar and stacked mobile layout.
- Built-in banners, images, notices, discussions, users, statistics, links and search.
- Add, duplicate and reorder widgets, choose guest/member audiences, and import or export layouts as JSON.
- Independent page heading, icon and subtitle; widget backgrounds, gradients, images, text styles and actions with light/dark palettes.
- Flarum's native discussion and user components, with data preloading and the current user's normal visibility rules.
- Optional two-way FoF Widgets Core bridge: use FoF widgets on the homepage or place homepage widgets in FoF layouts.
- English and Simplified Chinese translations; light, dark and high-contrast theme support.

| Widget | Use it for |
| --- | --- |
| Banner, image, notice | Welcome content, announcements, images and calls to action |
| Discussions | Search-based or selected discussions, optional excerpts and a featured first item |
| Users | Search-based or selected members, with optional biographies |
| Statistics | Totals, recent activity, tag discussion counts and permission-controlled online counts |
| Links, search | Navigation, compose/login actions and discussion search |
| FoF widget | An installed and enabled FoF widget provider |

## Installation

Requires PHP `^8.3` and Flarum `^2.0.2`. FoF Widgets Core is optional. Compiled frontend assets are included; Node.js is not needed for installation.

The repository is available for review on GitHub and **is not yet published on Packagist**. To try the current development branch, run these commands from your Flarum directory:

```sh
composer config repositories.diy-homepage vcs https://github.com/edgeinfinity1/flarum-diy-homepage
composer require edgeinfinity/diy-homepage:dev-main
php flarum cache:clear
```

`dev-main` follows development changes. Back up your forum and existing layout before evaluation. Tagged-package installation instructions will follow publication.

## Getting started

1. Enable **DIY Homepage** in the admin panel and open its settings.
2. Start with the supplied five-widget layout. Set the page heading and navigation label, then add, duplicate or rearrange widgets.
3. Choose each widget's region, audience, content and appearance. To show online counts, grant **View online member count (without identities)** on the Permissions page.
4. Click **Save Changes**, then open `/home`. Reload existing forum tabs to load the new configuration.

`/home` always opens the homepage. **Use the homepage as the guest landing page** is on by default: guests visiting `/` see the homepage, while signed-in users keep the forum's configured default route. With Flarum's normal All Discussions default:

| Visitor | `/` | `/home` | `/all` |
| --- | --- | --- | --- |
| Guest, landing page on | Homepage | Homepage | All Discussions |
| Signed in | All Discussions | Homepage | All Discussions |
| Guest, landing page off | All Discussions | Homepage | All Discussions |

The online-count permission grants counts only, without access to the online member list. Imported FoF widgets retain their providers' settings and permissions.

## Documentation and support

- [Full documentation](docs/DOCUMENTATION.md): detailed configuration, backgrounds and text, statistics permissions, JSON format, custom widgets and the FoF bridge.
- [Changelog](CHANGELOG.md), [contributing](CONTRIBUTING.md) and [release procedure](RELEASING.md).
- [Report an issue](https://github.com/edgeinfinity1/flarum-diy-homepage/issues) with your Flarum/PHP versions and steps to reproduce it.

## License

[MIT](LICENSE).

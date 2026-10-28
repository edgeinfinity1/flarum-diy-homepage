import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import Avatar from 'flarum/common/components/Avatar';
import Tooltip from 'flarum/common/components/Tooltip';
import username from 'flarum/common/helpers/username';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import { truncate } from 'flarum/common/utils/string';
import { t, ids, limit } from '../../common/utils';
import PostExcerpt from './PostExcerpt';
import CountUp from './CountUp';
import { defaultStats, statLabel } from '../../common/presentation';
import { statsFontStyle } from '../../common/widgetOptions';
import { displayText } from '../../common/utils';

class HomepageDiscussionListItem extends DiscussionListItem {
  oninit(vnode) {
    super.oninit(vnode);
    this.subtree.check(
      () => this.attrs.showExcerpt,
      () => this.attrs.featured,
      () => this.attrs.discussion.firstPost()?.freshness,
      () => this.attrs.discussion.lastPost()?.freshness,
    );
  }

  infoItems() {
    const items = super.infoItems();
    if (!this.attrs.showExcerpt || this.attrs.featured) {
      // The switch applies even if another route populated the store. Featured
      // excerpts live outside the native row, avoiding nested/duplicate links.
      items.remove('excerpt');
      items.remove('excerptM');
    } else if (!flarum.extensions['fof-synopsis'] && !items.has('excerpt')) {
      const post = this.attrs.discussion.firstPost();
      if (post?.contentType() === 'comment') items.add('excerpt', truncate(post.contentPlain() || '', 200), -100);
    }
    return items;
  }
}

class DataWidget extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.loading = true;
    this.records = [];
    const initial = app.data.diyHomepageData?.[this.attrs.widget.id];
    if (initial?.type === this.attrs.widget.type && window.location.href === app.initialRoute) {
      this.records = initial.type === 'stats' ? initial.payload.items : app.store.pushPayload(initial.payload);
      delete app.data.diyHomepageData[this.attrs.widget.id];
      this.loading = false;
    } else {
      this.load();
    }
  }

  load() {
    this.loading = true;
    this.error = false;
    this.fetch().then((records) => {
      this.records = records;
    }).catch(() => {
      this.error = true;
    }).finally(() => {
      this.loading = false;
      m.redraw();
    });
  }

  status() {
    if (this.loading) return this.placeholder();
    if (this.error) return m('div.DiyHome-empty', [
      m('p', t('forum.load_error')),
      m(Button, { className: 'Button Button--text', icon: 'fas fa-rotate-right', onclick: () => this.load() }, t('forum.retry')),
    ]);
    if (!this.records.length) return m('p.DiyHome-empty', t('forum.empty'));
    return null;
  }

  placeholder() {
    const settings = this.attrs.settings;
    const discussions = this.attrs.widget.type === 'discussions';
    return m('div.DiyHome-loading', { 'aria-busy': 'true', role: 'status' }, [
      m('span.sr-only', t('forum.loading')),
      m('div', { 'aria-hidden': 'true' }, Array.from({ length: limit(settings.limit) }, (_, i) =>
        m('div.DiyHome-skeletonRow', { className: discussions ? 'DiyHome-skeletonRow--discussion' + (settings.showExcerpt !== false ? ' DiyHome-skeletonRow--excerpt' : '') + (settings.featured && i === 0 ? ' DiyHome-skeletonRow--featured' : '') : '' }, [
          m('span.DiyHome-skeleton.DiyHome-skeletonAvatar'),
          m('div.DiyHome-skeletonLines', [m('span.DiyHome-skeleton'), m('span.DiyHome-skeleton'), discussions && settings.showExcerpt !== false && m('span.DiyHome-skeleton')]),
        ]))),
    ]);
  }
}

export class DiscussionsWidget extends DataWidget {
  async fetch() {
    const settings = this.attrs.settings;
    const selected = ids(settings.ids);
    const count = limit(settings.limit);
    const include = ['user', 'lastPostedUser', ...(flarum.extensions['flarum-tags'] ? ['tags'] : [])];
    if (settings.showExcerpt !== false) {
      // FoF normally adds its selected relationship in DiscussionListState.
      // Homepage requests are independent and must include it themselves.
      include.push(app.forum.attribute('synopsis.excerpt_type') === 'last' ? 'lastPost' : 'firstPost');
      if (settings.featured) include.push('firstPost');
    }
    const params = {
      include: [...new Set(include)].join(','),
      sort: ['-lastPostedAt', '-createdAt', '-commentCount'].includes(settings.sort) ? settings.sort : '-lastPostedAt',
      // Fetch all selected IDs before applying the display limit, so API sort
      // order cannot discard an administrator's first selected discussion.
      page: { limit: selected.length || count, total: 0 },
    };
    const options = { errorHandler: () => {} };
    const pinned = selected.length ? await app.store.find('discussions', selected, params, options) : [];
    const records = pinned.sort((a, b) => selected.indexOf(a.id()) - selected.indexOf(b.id())).slice(0, count);
    const seen = new Set(records.map((discussion) => discussion.id()));
    // Selected discussions lead even when they do not match the search. Fetch
    // enough search matches to fill around duplicates, honoring API pagination.
    let offset = 0;
    while (records.length < count) {
      const result = await app.store.find('discussions', {
        ...params,
        ...(settings.query ? { filter: { q: settings.query } } : {}),
        page: { limit: count + records.length, offset, total: 0 },
      }, undefined, options);
      for (const discussion of result) {
        if (!seen.has(discussion.id())) { records.push(discussion); seen.add(discussion.id()); }
        if (records.length === count) break;
      }
      if (!result.length || !result.payload?.links?.next) break;
      offset += result.length;
    }
    return records;
  }

  view() {
    const status = this.status();
    if (status) return status;
    const featured = !!this.attrs.settings.featured;
    const showExcerpt = this.attrs.settings.showExcerpt !== false;
    const sort = this.attrs.settings.sort === '-createdAt' ? 'newest' : this.attrs.settings.sort === '-commentCount' ? 'replies' : 'latest';
    return m('div.DiscussionList.DiyHome-discussions', this.records.map((discussion, i) => {
      const isFeatured = featured && i === 0;
      return m('article.DiyHome-discussion', { key: discussion.id(), className: isFeatured ? 'DiyHome-discussion--featured' : '' }, [
        m(HomepageDiscussionListItem, { discussion, params: { sort }, slidable: false, featured: isFeatured, showExcerpt }),
        isFeatured && m('div.DiyHome-featuredBody', [
          showExcerpt && discussion.firstPost() && m(PostExcerpt, { post: discussion.firstPost() }),
          m(Link, { href: app.route.discussion(discussion), className: 'DiyHome-readMore' }, [
            t('forum.read_more'), m(Icon, { name: 'fas fa-arrow-right' }),
          ]),
        ]),
      ]);
    }));
  }
}

export class UsersWidget extends DataWidget {
  async fetch() {
    const settings = this.attrs.settings;
    const selected = ids(settings.ids).slice(0, limit(settings.limit));
    const options = { errorHandler: () => {} };
    if (selected.length) {
      const results = await Promise.allSettled(selected.map((id) => app.store.find('users', id, {}, options)));
      const failure = results.find((result) => result.status === 'rejected' && ![403, 404].includes(result.reason?.status));
      if (failure && results.every((result) => result.status === 'rejected')) throw failure.reason;
      return results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
    }
    const params = {
      page: { limit: limit(settings.limit), total: 0 },
      sort: ['-joinedAt', '-commentCount', '-discussionCount'].includes(settings.sort) ? settings.sort : '-joinedAt',
    };
    if (settings.query) params.filter = { q: settings.query };
    return app.store.find('users', params, undefined, options);
  }

  view() {
    const status = this.status();
    if (status) return status;
    return m('ul.DiyHome-users', this.records.map((user) => m('li', { key: user.id() }, m(Link, {
      href: app.route.user(user),
      className: 'DiyHome-user',
    }, [
      m(Tooltip, { text: user.displayName(), position: 'left', container: 'body' }, m(Avatar, { user, title: '' })),
      m('div.DiyHome-userIdentity', [
        m('span.DiyHome-userName', username(user)),
        this.attrs.settings.showBio && user.attribute('bio')
          ? m('span.DiyHome-userDetail', user.attribute('bio'))
          : m('span.DiyHome-userDetail', t('forum.user_posts', { count: user.commentCount() || 0 })),
      ]),
      m(Icon, { name: 'fas fa-angle-right' }),
    ]))));
  }
}

export class StatsWidget extends DataWidget {
  async fetch() {
    const result = await app.request({ url: app.forum.attribute('apiUrl') + '/diy-homepage/stats', params: { widget: this.attrs.widget.id }, errorHandler: () => {} });
    return result.items;
  }

  view() {
    if (this.loading) return this.placeholder();
    const status = this.status();
    if (status) return status;
    return m('dl.DiyHome-stats', this.records.map((stat) => m('div', { key: stat.id }, [
      m('dt', { style: statsFontStyle(this.attrs.settings, 'label') }, [stat.icon && m(Icon, { name: stat.icon }), displayText(stat.label)]),
      m('dd', { style: statsFontStyle(this.attrs.settings, 'number') }, m(CountUp, { value: stat.count, animate: this.attrs.settings.animateNumbers !== false })),
    ])));
  }

  placeholder() {
    const stats = (this.attrs.settings.stats || defaultStats()).filter((item) => item.enabled !== false
      && (item.metric !== 'online' || app.forum.attribute('diyHomepage.canViewOnlineCount'))
      && (item.metric !== 'tagDiscussions' || flarum.extensions['flarum-tags']));
    return m('dl.DiyHome-stats.DiyHome-loading', { 'aria-busy': 'true', 'aria-label': t('forum.loading') }, stats.map((item) =>
      m('div', { key: item.id }, [
        m('dt', { style: statsFontStyle(this.attrs.settings, 'label') }, [item.icon && m(Icon, { name: item.icon }), item.label ? displayText(item.label) : statLabel(item)]),
        m('dd', { style: statsFontStyle(this.attrs.settings, 'number') }, m('span.DiyHome-skeleton.DiyHome-skeletonNumber', { 'aria-hidden': 'true' }, '\u00a0')),
      ])));
  }
}

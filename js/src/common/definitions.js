import { text } from './utils';

const field = (key, type = 'text', options) => ({ key, type, label: () => text('admin.fields.' + key), ...(options ? { options } : {}) });
const option = (key) => () => text('admin.options.' + key);
const sortOptions = { '-lastPostedAt': option('latest'), '-createdAt': option('newest'), '-commentCount': option('replies') };

export default function registerBuiltins(registry) {
  const definitions = {
    banner: {
      icon: 'fas fa-flag',
      defaults: { actions: [{ action: 'all', icon: 'far fa-comments' }, { action: 'signup', icon: 'fas fa-user-plus', audience: 'guests' }] },
      fields: [field('texts', 'texts'), field('actions', 'links')],
    },
    image: {
      icon: 'far fa-image',
      defaults: {},
      fields: [field('imageUrl', 'url'), field('alt'), field('url', 'url'), field('caption')],
    },
    notice: {
      icon: 'fas fa-bullhorn',
      defaults: { tone: 'soft', actions: [] },
      fields: [field('texts', 'texts'), field('tone', 'select', { soft: option('soft'), plain: option('plain'), accent: option('accent') }), field('actions', 'links')],
    },
    discussions: {
      icon: 'far fa-comments',
      defaults: { query: '', sort: '-lastPostedAt', limit: 5, featured: false, showExcerpt: true },
      fields: [field('query'), field('ids'), field('sort', 'select', sortOptions), field('limit', 'number'), field('featured', 'boolean'),
        { ...field('showExcerpt', 'boolean'), default: true, help: () => text('admin.field_help.showExcerpt') }],
    },
    users: {
      icon: 'fas fa-users',
      defaults: { ids: '', query: '', sort: '-joinedAt', limit: 5 },
      fields: [field('ids'), field('query'), field('sort', 'select', { '-joinedAt': option('members'), '-commentCount': option('posts'), '-discussionCount': option('discussions') }), field('limit', 'number'), field('showBio', 'boolean')],
    },
    stats: {
      icon: 'fas fa-chart-simple',
      defaults: {},
      fields: [field('stats', 'stats')],
    },
    links: {
      icon: 'fas fa-compass',
      defaults: { links: [{ action: 'all', icon: 'far fa-comments' }, { action: 'compose', icon: 'fas fa-pen' }] },
      fields: [field('links', 'links')],
    },
    search: {
      icon: 'fas fa-search',
      defaults: {},
      fields: [field('placeholder')],
    },
    fof: {
      icon: 'fas fa-puzzle-piece',
      defaults: { widgetId: '' },
      fields: [field('widgetId', 'fof')],
    },
  };
  Object.entries(definitions).forEach(([type, definition]) => registry.register(type, {
    ...definition,
    label: () => text('lib.widgets.' + type + '.name'),
    title: () => text('lib.widgets.' + type + '.title'),
  }));
}

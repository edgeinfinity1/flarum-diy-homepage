import app from 'flarum/common/app';
import { safeUrl, t, parseConfig } from './utils';

export const safeColor = (value) => typeof value === 'string' && /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value) ? value : null;
export const bounded = (value, fallback, min, max) => value !== '' && value != null && Number.isFinite(Number(value))
  ? Math.max(min, Math.min(max, Number(value))) : fallback;

export function contentWidthStyle(width, align = 'left') {
  if (width === '' || width == null) return {};
  return {
    maxWidth: bounded(width, 100, 1, 100) + '%',
    marginInlineStart: align === 'left' ? '0' : 'auto',
    marginInlineEnd: align === 'right' ? '0' : 'auto',
  };
}

// Old flat backgrounds remain the fallback for each theme until overridden.
export function backgroundPalette(background, theme) {
  const { light, dark, ...legacy } = background;
  return { ...legacy, ...background[theme] };
}

export function appearance() {
  return parseConfig(app.forum.attribute('diyHomepage.config')).appearance || {};
}

export function emphasizedTitle(widget) {
  if (widget.titleStyle === 'emphasized') return true;
  if (widget.titleStyle === 'fof') return false;
  return appearance().emphasizedTitles === true;
}

export function radiusStyle() {
  const radius = appearance().radius;
  return { '--diy-home-radius': radius === '' || radius == null ? 'var(--border-radius)' : bounded(radius, 4, 0, 64) + 'px' };
}

// Legacy configurations stay readable. An explicitly empty texts array means no
// text, and an explicitly empty legacy eyebrow means no eyebrow (no fallback).
export function textBlocks(widget) {
  const settings = widget.settings || {};
  if (Array.isArray(settings.texts)) return settings.texts;
  if (widget.type === 'notice') return [{ kind: 'body', text: settings.text ?? widget.subtitle ?? '', position: 'beforeActions', align: 'left' }];
  return [
    { kind: 'eyebrow', text: settings.eyebrow ?? '', position: 'beforeActions', align: 'left', showIcon: widget.showIcon !== false, icon: widget.icon || 'fas fa-star', iconImage: widget.iconImage || '' },
    { kind: 'title', text: widget.title || app.forum.attribute('title') || '', position: 'beforeActions', align: 'left' },
    { kind: 'body', text: settings.text ?? widget.subtitle ?? app.forum.attribute('description') ?? '', position: 'beforeActions', align: 'left' },
  ].filter((block) => block.text);
}

export const defaultStats = () => [
  { id: 'users', metric: 'users', enabled: true, icon: 'fas fa-users' },
  { id: 'discussions', metric: 'discussions', enabled: true, icon: 'far fa-comments' },
  { id: 'posts', metric: 'posts', enabled: true, icon: 'far fa-comment-dots' },
  { id: 'online', metric: 'online', enabled: false, icon: 'fas fa-user-clock', minutes: 5 },
  { id: 'recent-posts', metric: 'recentPosts', enabled: false, icon: 'fas fa-comment-medical', days: 7 },
  { id: 'recent-users', metric: 'recentUsers', enabled: false, icon: 'fas fa-user-plus', days: 7 },
];

export function statLabel(item) {
  return item.label || t('forum.stats.' + item.metric, { days: item.days || 7, minutes: item.minutes || 5, type: item.postType || 'comment', tag: item.tag || '' });
}

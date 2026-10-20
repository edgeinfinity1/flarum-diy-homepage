import app from 'flarum/common/app';
import extractText from 'flarum/common/utils/extractText';

export const t = (key, args = {}) => app.translator.trans('edgeinfinity-diy-homepage.' + key, args);
export const text = (key, args = {}) => extractText(t(key, args));
export const visible = (audience) => !audience || audience === 'all' || (audience === 'members' ? !!app.session.user : !app.session.user);
export function widgetTitle(widget) {
  if (widget.title) return widget.title;
  const definition = app.diyHomepage?.get(widget.type);
  const fallback = definition?.title || definition?.label;
  return typeof fallback === 'function' ? fallback() : fallback || widget.type;
}
export const ids = (value = '') => [...new Set(String(value).trim().split(/[\s,]+/).filter((id) => /^\d+$/.test(id)))].slice(0, 20);
export const limit = (value) => Math.max(1, Math.min(20, parseInt(value, 10) || 5));

// Local paths are relative to the forum, including a Flarum installation in a subdirectory.
export function safeUrl(value) {
  if (typeof value !== 'string' || !value || /[\u0000-\u0020\u007f\\]/.test(value) || value.startsWith('//')) return null;
  const base = app.forum.attribute('baseUrl') || window.location.origin;
  if (value.startsWith('/')) {
    const basePath = app.forum.attribute('basePath') || '';
    return basePath && (value === basePath || value.startsWith(basePath + '/')) ? value : basePath + value;
  }
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function externalUrl(url) {
  try {
    return new URL(url, window.location.origin).origin !== window.location.origin;
  } catch {
    return true;
  }
}

export function linkAttrs(url) {
  return { href: url, external: externalUrl(url), ...(externalUrl(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {}) };
}

export function parseConfig(value) {
  try {
    const config = typeof value === 'string' ? JSON.parse(value) : value;
    return config?.version === 1 && Array.isArray(config.widgets) ? config : { version: 1, widgets: [] };
  } catch {
    return { version: 1, widgets: [] };
  }
}

function validSafeWidth(value) {
  if (value === undefined || value === '') return true;
  const numeric = typeof value === 'number' ? value
    : typeof value === 'string' && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()) ? Number(value) : NaN;
  return Number.isFinite(numeric) && numeric >= 1 && numeric <= 100;
}

export function validConfig(value) {
  const config = JSON.parse(value);
  if (config?.version !== 1 || !Array.isArray(config.widgets) || config.widgets.length > 50) throw new Error(text('admin.invalid_config'));
  const seen = new Set();
  for (const widget of config.widgets) {
    if (!widget || typeof widget !== 'object' || Array.isArray(widget)) throw new Error(text('admin.invalid_config'));
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(widget.id) || seen.has(widget.id) || !/^[a-zA-Z0-9_.:-]{1,100}$/.test(widget.type)
      || !['fullWidth', 'top', 'main', 'sidebar'].includes(widget.region) || !['all', 'guests', 'members'].includes(widget.audience || 'all')) {
      throw new Error(text('admin.invalid_config'));
    }
    if (widget.enabled !== undefined && typeof widget.enabled !== 'boolean') throw new Error(text('admin.invalid_config'));
    if (widget.titleStyle !== undefined && !['inherit', 'fof', 'emphasized'].includes(widget.titleStyle)) throw new Error(text('admin.invalid_config'));
    for (const key of ['title', 'subtitle', 'icon', 'linkLabel', 'linkUrl']) {
      if (widget[key] !== undefined && (typeof widget[key] !== 'string' || widget[key].length > 2000)) throw new Error(text('admin.invalid_config'));
    }
    const settings = widget.settings || {};
    if (typeof settings !== 'object' || Array.isArray(settings)) throw new Error(text('admin.invalid_config'));
    if (!validSafeWidth(settings.actionsSafeWidth)) throw new Error(text('admin.invalid_config'));
    if (settings.texts !== undefined) {
      if (!Array.isArray(settings.texts) || settings.texts.length > 20) throw new Error(text('admin.invalid_config'));
      for (const block of settings.texts) {
        if (!block || typeof block !== 'object' || Array.isArray(block) || typeof block.text !== 'string' || block.text.length > 12000
          || !['eyebrow', 'title', 'body', 'caption', 'custom'].includes(block.kind || 'body')
          || !['beforeActions', 'afterActions'].includes(block.position || 'beforeActions')
          || !['left', 'center', 'right'].includes(block.align || 'left')) throw new Error(text('admin.invalid_config'));
        if (block.showIcon !== undefined && typeof block.showIcon !== 'boolean') throw new Error(text('admin.invalid_config'));
        if (!validSafeWidth(block.safeWidth)) throw new Error(text('admin.invalid_config'));
        if (block.marginBottom !== undefined && block.marginBottom !== '') {
          const value = block.marginBottom;
          const numeric = typeof value === 'number' ? value
            : typeof value === 'string' && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()) ? Number(value) : NaN;
          if (!Number.isFinite(numeric) || numeric < 0 || numeric > 120) throw new Error(text('admin.invalid_config'));
        }
        if (block.fontSize !== undefined && block.fontSize !== '' && (!Number.isFinite(Number(block.fontSize)) || Number(block.fontSize) < 12 || Number(block.fontSize) > 120)) {
          throw new Error(text('admin.invalid_config'));
        }
        if (block.fontFamily !== undefined && (typeof block.fontFamily !== 'string' || block.fontFamily.length > 300 || /[;{}<>\\\u0000-\u001f]/.test(block.fontFamily))) {
          throw new Error(text('admin.invalid_config'));
        }
        if (block.fontColor !== undefined) {
          if (!block.fontColor || typeof block.fontColor !== 'object' || Array.isArray(block.fontColor)
            || Object.keys(block.fontColor).some((theme) => !['light', 'dark'].includes(theme))) throw new Error(text('admin.invalid_config'));
          for (const theme of ['light', 'dark']) {
            const color = block.fontColor[theme];
            if (color !== undefined && (typeof color !== 'string' || (color !== '' && !/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(color)))) {
              throw new Error(text('admin.invalid_config'));
            }
          }
        }
        if (block.iconImage && !safeUrl(block.iconImage)) throw new Error(text('admin.invalid_config'));
      }
    }
    for (const key of ['text', 'eyebrow', 'alt', 'caption', 'query', 'ids', 'placeholder', 'widgetId', 'sort', 'tone']) {
      if (settings[key] !== undefined && (typeof settings[key] !== 'string' || settings[key].length > 12000)) throw new Error(text('admin.invalid_config'));
    }
    for (const key of ['featured', 'showBio', 'showExcerpt']) {
      if (settings[key] !== undefined && typeof settings[key] !== 'boolean') throw new Error(text('admin.invalid_config'));
    }
    if (settings.limit !== undefined && (!Number.isFinite(Number(settings.limit)) || Number(settings.limit) < 1 || Number(settings.limit) > 20)) throw new Error(text('admin.invalid_config'));
    for (const url of [widget.linkUrl, settings.imageUrl, settings.url]) {
      if (url !== undefined && url !== '' && !safeUrl(url)) throw new Error(text('admin.invalid_config'));
    }
    for (const key of ['links', 'actions']) {
      if (settings[key] === undefined) continue;
      if (!Array.isArray(settings[key]) || settings[key].length > 12) throw new Error(text('admin.invalid_config'));
      for (const link of settings[key]) {
        if (!link || typeof link !== 'object' || Array.isArray(link)) throw new Error(text('admin.invalid_config'));
        for (const field of ['label', 'icon', 'url', 'action']) {
          if (link[field] !== undefined && typeof link[field] !== 'string') throw new Error(text('admin.invalid_config'));
        }
        if (link.url && !safeUrl(link.url)) throw new Error(text('admin.invalid_config'));
        if (!['all', 'guests', 'members'].includes(link.audience || 'all')) throw new Error(text('admin.invalid_config'));
      }
    }
    seen.add(widget.id);
  }
  return config;
}

import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import ActionLink from './ActionLink';
import { t, safeUrl, linkAttrs } from '../../common/utils';
import { bounded, safeColor, textBlocks, contentWidthStyle } from '../../common/presentation';
import WidgetIcon from './WidgetIcon';
import Background from './Background';

const providerHeights = new Map();
const providerHeightKey = (attrs) => [attrs.widget.id, attrs.widget.region, attrs.settings.widgetId, app.session.user?.id() || 'guest', window.innerWidth].join(':');
function savedProviderHeight(attrs) {
  const key = providerHeightKey(attrs);
  if (providerHeights.has(key)) return providerHeights.get(key);
  try {
    const saved = JSON.parse(sessionStorage.getItem('diyHomepage.height.' + key));
    if (saved && Date.now() - saved.at < 1800000 && saved.height > 0 && saved.height <= 3000) return saved.height;
  } catch {}
  return 120;
}

function renderText(block, index, settings = {}) {
  if (!block.text) return null;
  const kind = ['eyebrow', 'title', 'body', 'caption', 'custom'].includes(block.kind) ? block.kind : 'body';
  const tag = kind === 'title' ? 'h1' : kind === 'custom' ? 'h2' : 'div';
  const lightColor = kind === 'custom' ? safeColor(block.fontColor?.light) : null;
  const darkColor = kind === 'custom' ? safeColor(block.fontColor?.dark) : null;
  return m(tag + '.DiyHome-textBlock.DiyHome-textBlock--' + kind, { key: index, style: {
    textAlign: block.align || 'left',
    ...contentWidthStyle(block.safeWidth, block.align),
    ...(block.marginBottom !== undefined && block.marginBottom !== '' ? { marginBottom: bounded(block.marginBottom, 14, 0, 120) + 'px' } : {}),
    ...(kind === 'custom' ? {
      ...(block.fontSize ? { fontSize: bounded(block.fontSize, 24, 12, 120) + 'px' } : {}),
      ...(block.fontFamily ? { fontFamily: block.fontFamily } : {}),
      ...(lightColor ? { '--diy-home-text-color-light': lightColor } : {}),
      ...(darkColor ? { '--diy-home-text-color-dark': darkColor } : {}),
    } : kind === 'title' ? {
      ...(settings.titleFontSize ? { fontSize: bounded(settings.titleFontSize, 32, 12, 120) + 'px' } : {}),
      ...(settings.titleFontFamily ? { fontFamily: settings.titleFontFamily } : {}),
    } : {}),
  } }, [
    block.showIcon && m(WidgetIcon, { icon: block.icon, image: block.iconImage }),
    m('span', block.text),
  ]);
}

export class BannerWidget extends Component {
  view() {
    const { widget, settings } = this.attrs;
    const image = safeUrl(settings.imageUrl);
    const custom = ['solid', 'gradient'].includes(widget.background?.mode);
    const decoration = settings.decoration || {};
    const decorated = decoration.enabled !== false;
    const texts = textBlocks(widget);
    return m('div.DiyHome-banner', { className: (image && !custom ? 'DiyHome-banner--withImage ' : '') + (!decorated ? 'DiyHome-banner--noDecoration' : '') }, [
      image && !custom && m('img.DiyHome-bannerImage', { src: image, alt: '', loading: 'lazy' }),
      m(Background, { background: widget.background }),
      m('div.DiyHome-bannerContent.DiyHome-surfaceForeground', [
        texts.filter((block) => block.position !== 'afterActions').map((block, i) => renderText(block, i, settings)),
        (settings.actions || []).length > 0 && m('div.DiyHome-actions', { style: {
          ...contentWidthStyle(settings.actionsSafeWidth, settings.actionsAlign),
          justifyContent: { center: 'center', right: 'flex-end' }[settings.actionsAlign] || 'flex-start',
        } }, settings.actions.map((item, i) => m(ActionLink, {
          key: i, item, className: i === 0 ? 'Button Button--primary' : 'Button DiyHome-secondaryAction',
        }))),
        texts.filter((block) => block.position === 'afterActions').map((block, i) => renderText(block, i, settings)),
      ]),
      decorated && m('div.DiyHome-bannerDecoration', { 'aria-hidden': 'true', style: {
        width: bounded(decoration.size, 140, 24, 400) + 'px', height: bounded(decoration.size, 140, 24, 400) + 'px',
        left: bounded(decoration.x, 88, 0, 100) + '%', top: bounded(decoration.y, 50, 0, 100) + '%',
        opacity: bounded(decoration.opacity, .5, 0, 1),
      } }, [
        decoration.orbits !== false && [m('span.DiyHome-orbit.DiyHome-orbit--one'), m('span.DiyHome-orbit.DiyHome-orbit--two')],
        m('span.DiyHome-bannerMark', m(WidgetIcon, { icon: decoration.icon ?? widget.icon ?? 'far fa-comments', image: decoration.imageUrl })),
      ]),
    ]);
  }
}

export class ImageWidget extends Component {
  view() {
    const { settings } = this.attrs;
    const image = safeUrl(settings.imageUrl);
    if (!image) return m('p.DiyHome-empty', t('forum.no_image'));
    const url = safeUrl(settings.url);
    const content = m('img.DiyHome-image', { src: image, alt: settings.alt || '', loading: 'lazy', decoding: 'async' });
    return m('figure.DiyHome-figure', [
      url ? m(Link, linkAttrs(url), content) : content,
      settings.caption && m('figcaption', settings.caption),
    ]);
  }
}

export class NoticeWidget extends Component {
  view() {
    const { widget, settings } = this.attrs;
    const tone = ['soft', 'plain', 'accent'].includes(settings.tone) ? settings.tone : 'soft';
    return m('div.DiyHome-notice', { className: 'DiyHome-notice--' + tone }, [
      textBlocks(widget).filter((block) => block.position !== 'afterActions').map((block, i) => renderText(block, i)),
      (settings.actions || []).length > 0 && m('div.DiyHome-actions', settings.actions.map((item, i) => m(ActionLink, { key: i, item }))),
      textBlocks(widget).filter((block) => block.position === 'afterActions').map((block, i) => renderText(block, i)),
    ]);
  }
}

export class LinksWidget extends Component {
  view() {
    return m('div.DiyHome-links', (this.attrs.settings.links || []).map((item, i) => m(ActionLink, { key: i, item })));
  }
}

export class SearchWidget extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.query = '';
  }

  view() {
    const placeholder = this.attrs.settings.placeholder || t('forum.search_placeholder');
    return m('form.DiyHome-search', {
      onsubmit: (event) => {
        event.preventDefault();
        const query = this.query.trim();
        if (query) m.route.set(app.route('index', { q: query }));
      },
      role: 'search',
    }, [
      m('input.FormControl', {
        type: 'search',
        placeholder,
        'aria-label': placeholder,
        maxlength: 300,
        value: this.query,
        oninput: (event) => { this.query = event.target.value; },
      }),
      m(Button, { type: 'submit', className: 'Button Button--primary', icon: 'fas fa-search', disabled: !this.query.trim() }, t('forum.search')),
    ]);
  }
}

export class FoFWidget extends Component {
  oncreate(vnode) {
    super.oncreate(vnode);
    if (!this.element?.querySelector) return;
    const measure = () => {
      const content = this.element.querySelector('.FofWidgets-Widget-content') || this.element;
      const key = providerHeightKey(this.attrs);
      const loading = !!content.querySelector('.LoadingIndicator, .LoadingIndicator-container, [aria-busy="true"]');
      content.classList.toggle('DiyHome-providerLoading', loading);
      if (loading) {
        content.style.minHeight = (Number(this.attrs.widget.loadingHeight) || savedProviderHeight(this.attrs)) + 'px';
      } else {
        content.style.minHeight = '';
        const height = content.getBoundingClientRect().height;
        if (height > 0 && height <= 3000 && providerHeights.get(key) !== height) {
          providerHeights.set(key, height);
          try { sessionStorage.setItem('diyHomepage.height.' + key, JSON.stringify({ height, at: Date.now() })); } catch {}
        }
      }
    };
    // Provider redraws do not necessarily redraw this adapter.
    this.observer = new MutationObserver(measure);
    this.observer.observe(this.element, { childList: true, subtree: true });
    this.resizeObserver = new ResizeObserver(measure);
    this.resizeObserver.observe(this.element);
    measure();
  }

  onremove(vnode) {
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
    super.onremove(vnode);
  }

  view() {
    const id = this.attrs.settings.widgetId;
    if (!id || id.startsWith('edgeinfinity-diy-homepage:')) return null;
    // FoF's getbyId() excludes providers removed from its own layout. Homepage
    // imports use the registry independently, while retaining provider checks.
    const widget = app.widgets?.widgets?.find((candidate) => candidate.id === id);
    if (!widget?.component || (typeof widget.isDisabled === 'function' ? widget.isDisabled() : widget.isDisabled)) return null;
    const extension = widget.extension || widget.id.split(':')[0];
    if (!(extension in flarum.extensions)) return null;
    return m('div.DiyHome-fof', { style: { '--diy-home-loading-height': (Number(this.attrs.widget.loadingHeight) || savedProviderHeight(this.attrs)) + 'px' } }, m(widget.component, { state: app.widgets.states[id] || (app.widgets.states[id] = {}) }));
  }
}

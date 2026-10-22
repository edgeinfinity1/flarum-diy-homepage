import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import Switch from 'flarum/common/components/Switch';
import Form from 'flarum/common/components/Form';
import Icon from 'flarum/common/components/Icon';
import { t, text, parseConfig, validConfig } from '../../common/utils';
import registerFoFWidgets from '../../common/fofBridge';
import { backgroundPalette, textBlocks, defaultStats, safeColor } from '../../common/presentation';

const key = 'edgeinfinity-diy-homepage.';
const regions = ['fullWidth', 'top', 'main', 'sidebar', 'configOnly'];
const audiences = ['all', 'guests', 'members'];

export default class HomeSettingsPage extends ExtensionPage {
  oninit(vnode) {
    super.oninit(vnode);
    this.config = parseConfig(this.setting(key + 'config')());
    this.expanded = new Set();
    this.newType = 'banner';
    this.json = JSON.stringify(this.config, null, 2);
    this.showJson = false;
    this.jsonError = '';
  }

  commit() {
    this.setting(key + 'config')(JSON.stringify(this.config));
    this.json = JSON.stringify(this.config, null, 2);
    this.jsonError = '';
  }

  section(name, children, open = false) {
    return m('details.DiyHomeEditor-section', { open }, [m('summary', t('admin.groups.' + name)), children]);
  }

  nested(widget, object, field, value, settings = false) {
    const parent = settings ? (widget.settings ||= {}) : widget;
    (parent[object] ||= {})[field] = value;
    this.commit();
  }

  number(value, onchange, min, max, step = 1, placeholder = '') {
    return this.input(value, (value) => onchange(value === '' ? '' : Number(value)), { type: 'number', min, max, step, placeholder });
  }

  appearanceEditor() {
    const appearance = this.config.appearance || {};
    const update = (field, value) => { (this.config.appearance ||= {})[field] = value; this.commit(); };
    return this.section('appearance', [
      this.field(t('admin.radius'), this.number(appearance.radius ?? '', (value) => update('radius', value), 0, 64, 1, text('admin.theme_default')), t('admin.radius_help')),
      m(Switch, { state: appearance.emphasizedTitles === true, onchange: (value) => update('emphasizedTitles', value) }, t('admin.emphasized_titles')),
      m('p.helpText', t('admin.emphasized_help')),
    ], true);
  }

  heroEditor() {
    return this.section('hero', [
      m('div.Form-group', m(Switch, {
        state: !['0', 0, false, ''].includes(this.setting(key + 'hero_enabled')()),
        onchange: (value) => this.setting(key + 'hero_enabled')(value ? '1' : '0'),
      }, t('admin.hero_enabled'))),
      m('p.helpText', t('admin.hero_enabled_help')),
      this.field(t('admin.hero_title'), this.input(this.setting(key + 'hero_title')(), this.setting(key + 'hero_title'), { maxlength: 200 }), t('admin.hero_title_help')),
      this.field(t('admin.hero_subtitle'), m('textarea.FormControl', {
        rows: 3, maxlength: 2000, value: this.setting(key + 'hero_subtitle')() || '',
        oninput: (event) => this.setting(key + 'hero_subtitle')(event.target.value),
      }), t('admin.hero_subtitle_help')),
      m('div.Form-group', m(Switch, {
        state: !['0', 0, false, ''].includes(this.setting(key + 'hero_show_icon')()),
        onchange: (value) => this.setting(key + 'hero_show_icon')(value ? '1' : '0'),
      }, t('admin.hero_show_icon'))),
      m('div.DiyHomeEditor-fieldGrid', [
        this.field(t('admin.icon'), this.input(this.setting(key + 'hero_icon')(), this.setting(key + 'hero_icon'), { maxlength: 200, placeholder: 'fas fa-house' })),
        this.field(t('admin.icon_image'), this.input(this.setting(key + 'hero_icon_image')(), this.setting(key + 'hero_icon_image'), { maxlength: 2000 }), t('admin.hero_icon_help')),
      ]),
    ], true);
  }

  onsaved() {
    super.onsaved();
    if (!app.widgets) return;
    app.widgets.widgets = app.widgets.widgets.filter((widget) => widget.extension !== 'edgeinfinity-diy-homepage');
    registerFoFWidgets(app, this.config);
  }

  update(widget, field, value, settings = false) {
    if (settings) {
      widget.settings ||= {};
      widget.settings[field] = value;
    } else {
      widget[field] = value;
    }
    this.commit();
  }

  select(value, options, onchange, attrs = {}) {
    return m('select.FormControl', { value, onchange: (event) => onchange(event.target.value), ...attrs },
      Object.entries(options).map(([value, label]) => m('option', { value }, typeof label === 'function' ? label() : label)));
  }

  input(value, onchange, attrs = {}) {
    return m('input.FormControl', {
      type: 'text', value: value ?? '', oninput: (event) => onchange(event.target.value), ...attrs,
    });
  }

  field(label, input, help) {
    return m('label.DiyHomeEditor-field', [
      m('span.DiyHomeEditor-label', label), input, help && m('span.helpText', help),
    ]);
  }

  add(region = null) {
    if (this.config.widgets.length >= 50) return;
    const definition = app.diyHomepage.get(this.newType);
    const widget = {
      id: 'widget-' + Date.now().toString(36),
      type: this.newType,
      region: region || (this.newType === 'banner' ? 'top' : 'main'),
      enabled: true, audience: 'all', title: '', subtitle: '', icon: '',
      settings: JSON.parse(JSON.stringify(definition.defaults || {})),
    };
    this.config.widgets.push(widget);
    this.expanded.add(widget.id);
    this.commit();
  }

  move(widget, direction) {
    const group = this.config.widgets.filter((item) => item.region === widget.region);
    const sibling = group[group.indexOf(widget) + direction];
    if (!sibling) return;
    const from = this.config.widgets.indexOf(widget);
    const to = this.config.widgets.indexOf(sibling);
    [this.config.widgets[from], this.config.widgets[to]] = [this.config.widgets[to], this.config.widgets[from]];
    this.commit();
  }

  duplicate(widget) {
    if (this.config.widgets.length >= 50) return;
    const copy = JSON.parse(JSON.stringify(widget));
    copy.id = 'widget-' + Date.now().toString(36);
    this.config.widgets.splice(this.config.widgets.indexOf(widget) + 1, 0, copy);
    this.expanded.add(copy.id);
    this.commit();
  }

  remove(widget) {
    this.config.widgets.splice(this.config.widgets.indexOf(widget), 1);
    this.expanded.delete(widget.id);
    this.commit();
  }

  content() {
    return m('div.ExtensionPage-settings.DiyHomeEditor', m('div.container', [
      m('p.helpText', t('admin.intro')),
      m(Form, { onsubmit: this.saveSettings.bind(this) }, [
        m('div.DiyHomeEditor-settings', [
          this.field(t('admin.nav_label'), this.input(this.setting(key + 'nav_label')(), this.setting(key + 'nav_label'), { maxlength: 80, placeholder: text('lib.home') })),
          this.heroEditor(),
          m('div.Form-group', m(Switch, {
            state: this.setting(key + 'guest_home')() !== '0' && !!this.setting(key + 'guest_home')(),
            onchange: (value) => this.setting(key + 'guest_home')(value ? '1' : '0'),
          }, t('admin.guest_home'))),
          m('p.helpText', t('admin.routes_help')),
          m('div.Form-group', m(Switch, {
            state: this.setting(key + 'sticky_sidebar')() !== '0' && !!this.setting(key + 'sticky_sidebar')(),
            onchange: (value) => this.setting(key + 'sticky_sidebar')(value ? '1' : '0'),
          }, t('admin.sticky_sidebar'))),
          this.appearanceEditor(),
        ]),
        m('div.DiyHomeEditor-toolbar', [
          this.select(this.newType, Object.fromEntries(app.diyHomepage.all().map(([id, definition]) => [id, definition.label || id])), (value) => { this.newType = value; }, { 'aria-label': text('admin.widget_type') }),
          m(Button, { className: 'Button Button--primary', icon: 'fas fa-plus', onclick: () => this.add(), disabled: this.config.widgets.length >= 50 }, t('admin.add_widget')),
          m(Button, { className: 'Button', icon: 'fas fa-plus', onclick: () => this.add('configOnly'), disabled: this.config.widgets.length >= 50 }, t('admin.add_config_only')),
          m('a.Button', { href: app.forum.attribute('baseUrl') + '/home', target: '_blank', rel: 'noopener' }, [
            m(Icon, { name: 'fas fa-arrow-up-right-from-square' }), ' ', t('admin.open_home'),
          ]),
        ]),
        m('div.DiyHomeEditor-layout', regions.map((region) => m('section.DiyHomeEditor-region', { key: region }, [
          m('h3', t('admin.regions.' + region)),
          m('p.helpText', t('admin.region_help.' + region)),
          this.config.widgets.filter((widget) => widget.region === region).map((widget) => this.widgetEditor(widget)),
          !this.config.widgets.some((widget) => widget.region === region) && m('p.DiyHomeEditor-empty', t('admin.empty_region')),
        ]))),
        m('div.Form-group.Form-controls', this.submitButton()),
        m('details.DiyHomeEditor-json', [
          m('summary', t('admin.advanced')),
          m('p.helpText', t('admin.json_help')),
          m('textarea.FormControl', {
            rows: 16, value: this.json, spellcheck: false, 'aria-label': text('admin.configuration'),
            oninput: (event) => { this.json = event.target.value; },
          }),
          this.jsonError && m('p.DiyHomeEditor-error', { role: 'alert' }, this.jsonError),
          m(Button, {
            className: 'Button', icon: 'fas fa-file-import',
            onclick: () => {
              try {
                this.config = validConfig(this.json);
                this.expanded.clear();
                this.commit();
              } catch (error) {
                this.jsonError = error.message;
              }
            },
          }, t('admin.apply_json')),
        ]),
        m('p.helpText.DiyHomeEditor-bridgeHelp', t('admin.bridge_help')),
      ]),
    ]));
  }

  widgetEditor(widget) {
    const definition = app.diyHomepage.get(widget.type);
    const expanded = this.expanded.has(widget.id);
    const group = this.config.widgets.filter((item) => item.region === widget.region);
    return m('article.DiyHomeEditor-widget', { key: widget.id, className: widget.enabled === false ? 'DiyHomeEditor-widget--disabled' : '' }, [
      m('div.DiyHomeEditor-widgetBar', [
        m(Button, {
          className: 'Button Button--text DiyHomeEditor-toggle',
          'aria-expanded': expanded,
          onclick: () => expanded ? this.expanded.delete(widget.id) : this.expanded.add(widget.id),
        }, [
          m(Icon, { name: widget.icon || definition?.icon || 'fas fa-puzzle-piece' }),
          m('span', widget.title || (definition?.label ? definition.label() : widget.type)),
          m(Icon, { name: expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down' }),
        ]),
        m(Button, { className: 'Button Button--icon', icon: 'fas fa-arrow-up', title: text('admin.move_up'), 'aria-label': text('admin.move_up'), disabled: group[0] === widget, onclick: () => this.move(widget, -1) }),
        m(Button, { className: 'Button Button--icon', icon: 'fas fa-arrow-down', title: text('admin.move_down'), 'aria-label': text('admin.move_down'), disabled: group[group.length - 1] === widget, onclick: () => this.move(widget, 1) }),
      ]),
      expanded && m('div.DiyHomeEditor-widgetBody', [
        m('code.DiyHomeEditor-id', widget.id + ' · ' + widget.type),
        !definition && m('p.helpText', t('admin.unavailable_type')),
        this.section('placement', [m('div.DiyHomeEditor-fieldGrid', [
          this.field(t('admin.region'), this.select(widget.region, Object.fromEntries(regions.map((key) => [key, t('admin.regions.' + key)])), (value) => this.update(widget, 'region', value))),
          this.field(t('admin.audience'), this.select(widget.audience || 'all', Object.fromEntries(audiences.map((key) => [key, t('admin.audiences.' + key)])), (value) => this.update(widget, 'audience', value))),
        ])], true),
        this.section('heading', [m('div.DiyHomeEditor-fieldGrid', [
          this.field(t('admin.title'), this.input(widget.title, (value) => this.update(widget, 'title', value))),
          this.field(t('admin.icon'), this.input(widget.icon, (value) => this.update(widget, 'icon', value), { placeholder: definition?.icon || 'fas fa-house' })),
        ]),
        this.field(t('admin.title_style'), this.select(widget.titleStyle || 'inherit', Object.fromEntries(['inherit','fof','emphasized'].map((style) => [style, t('admin.title_styles.' + style)])), (value) => this.update(widget, 'titleStyle', value)), t('admin.title_style_help')),
        this.field(t('admin.icon_image'), this.input(widget.iconImage, (value) => this.update(widget, 'iconImage', value))),
        m('div.Form-group', m(Switch, { state: widget.showIcon !== false, onchange: (value) => this.update(widget, 'showIcon', value) }, t('admin.show_icon'))),
        m('div.Form-group', m(Switch, { state: widget.showTitle !== false, onchange: (value) => this.update(widget, 'showTitle', value) }, t('admin.show_heading'))),
        this.field(t('admin.subtitle'), this.input(widget.subtitle, (value) => this.update(widget, 'subtitle', value))),
        m('div.DiyHomeEditor-fieldGrid', [
          this.field(t('admin.link_label'), this.input(widget.linkLabel, (value) => this.update(widget, 'linkLabel', value))),
          this.field(t('admin.link_url'), this.input(widget.linkUrl, (value) => this.update(widget, 'linkUrl', value), { placeholder: '/all' })),
        ])]),
        this.section('content', (definition?.fields || []).filter((field) => !['links','actions'].includes(field.key)).map((field) => this.settingField(widget, field)), true),
        (['discussions','users','stats','fof'].includes(widget.type) || definition?.loading === true) && this.section('loading', [
          ['discussions','users','stats'].includes(widget.type) && this.field(t('admin.load_mode'), this.select(widget.settings?.loadMode || 'preload', Object.fromEntries(['preload','async'].map((name) => [name, t('admin.load_modes.' + name)])), (value) => this.update(widget, 'loadMode', value, true)), t('admin.load_mode_help')),
          this.field(t('admin.loading_height'), this.number(widget.loadingHeight ?? '', (value) => this.update(widget, 'loadingHeight', value), 0, 3000, 1, text('admin.automatic')), t('admin.loading_height_help')),
          widget.type === 'fof' && m('p.helpText', t('admin.fof_loading_help')),
          widget.type === 'stats' && m(Switch, { state: widget.settings?.animateNumbers !== false, onchange: (value) => this.update(widget, 'animateNumbers', value, true) }, t('admin.animate_numbers')),
        ]),
        this.section('actions', [
          ...(definition?.fields || []).filter((field) => ['links','actions'].includes(field.key)).map((field) => this.settingField(widget, field)),
          widget.type === 'banner' && this.field(t('admin.actions_align'), this.select(widget.settings?.actionsAlign || 'left', this.alignmentOptions(), (value) => this.update(widget, 'actionsAlign', value, true))),
          widget.type === 'banner' && this.field(t('admin.actions_safe_width'), this.number(widget.settings?.actionsSafeWidth ?? '', (value) => this.update(widget, 'actionsSafeWidth', value, true), 1, 100, 1, text('admin.default_safe_width')), t('admin.content_safe_width_help')),
        ]),
        widget.type !== 'fof' && this.backgroundEditor(widget),
        widget.type === 'banner' && this.decorationEditor(widget),
        m('div.DiyHomeEditor-widgetActions', [
          m(Switch, { state: widget.enabled !== false, onchange: (value) => this.update(widget, 'enabled', value) }, t('admin.enabled')),
          m(Button, { className: 'Button Button--text', icon: 'far fa-copy', disabled: this.config.widgets.length >= 50, onclick: () => this.duplicate(widget) }, t('admin.duplicate')),
          m(Button, { className: 'Button Button--text', icon: 'far fa-trash-alt', onclick: () => this.remove(widget) }, t('admin.remove')),
        ]),
      ]),
    ]);
  }

  settingField(widget, field) {
    const value = widget.settings?.[field.key] ?? field.default;
    const update = (value) => this.update(widget, field.key, value, true);
    const label = typeof field.label === 'function' ? field.label() : field.label;
    let input;
    if (field.type === 'links') return this.linksEditor(widget, field, label);
    if (field.type === 'texts') return this.textsEditor(widget);
    if (field.type === 'stats') return this.statsEditor(widget);
    if (field.type === 'themeColors') return m('div.DiyHomeEditor-themeColors', [
      m('h4', label),
      field.help && m('p.helpText', typeof field.help === 'function' ? field.help() : field.help),
      m('div.DiyHomeEditor-themeColumns', ['light', 'dark'].map((theme) => m('fieldset.DiyHomeEditor-themeColumn', [
        m('legend', t('admin.background_themes.' + theme)),
        this.field(label, m('span.DiyHomeEditor-colorControl', [
          m('span', { className: 'DiyHomeEditor-colorSwatch' + (safeColor(value?.[theme]) ? '' : ' DiyHomeEditor-colorSwatch--inherit'),
            style: safeColor(value?.[theme]) ? { backgroundColor: safeColor(value[theme]) } : {}, 'aria-hidden': 'true' }),
          this.input(value?.[theme] ?? '', (color) => update({ ...(widget.settings?.[field.key] || {}), [theme]: color.trim() }),
            { maxlength: 9, placeholder: text('admin.theme_default') + ' / #rrggbb' }),
        ])),
      ]))),
    ]);
    if (field.type === 'boolean') return m('div.Form-group', [
      m(Switch, { state: value === undefined ? field.default === true : !!value, onchange: update }, label),
      field.help && m('p.helpText', typeof field.help === 'function' ? field.help() : field.help),
    ]);
    if (field.type === 'textarea') {
      input = m('textarea.FormControl', { rows: 4, value: value || '', oninput: (event) => update(event.target.value) });
    } else if (field.type === 'select') {
      input = this.select(value || Object.keys(field.options || {})[0], field.options || {}, update);
    } else if (field.type === 'fof') {
      const widgets = app.widgets?.widgets.filter((widget) => widget.extension !== 'edgeinfinity-diy-homepage') || [];
      input = this.select(value || '', {
        '': text('admin.choose_fof'),
        ...Object.fromEntries(widgets.map((widget) => [widget.id, widget.id])),
      }, update);
    } else {
      input = this.input(value, (value) => update(field.type === 'number'
        ? (value === '' ? (field.default ?? field.min ?? 1) : Number(value))
        : value), {
        type: field.type === 'number' ? 'number' : 'text',
        ...(field.type === 'number' ? { min: field.min ?? 1, max: field.max ?? 20, step: field.step ?? 1 } : {}),
        ...(field.type === 'url' ? { placeholder: '/path or https://…' } : {}),
      });
    }
    const help = field.key === 'ids' && widget.type === 'discussions' ? t('admin.field_help.discussion_ids')
      : ['query', 'ids', 'widgetId', 'imageUrl'].includes(field.key) ? t('admin.field_help.' + field.key) : field.help;
    return this.field(label, input, typeof help === 'function' ? help() : help);
  }

  linksEditor(widget, field, label) {
    const links = widget.settings?.[field.key] || [];
    const update = () => this.update(widget, field.key, links, true);
    return m('div.DiyHomeEditor-links', [
      m('h4', label),
      links.map((link, index) => m('div.DiyHomeEditor-link', [
        this.field(t('admin.fields.action'), this.select(link.action || 'url', Object.fromEntries(['url', 'all', 'compose', 'signup', 'login'].map((key) => [key, t('lib.actions.' + key)])), (value) => { link.action = value; update(); })),
        this.field(t('admin.link_label'), this.input(link.label, (value) => { link.label = value; update(); })),
        (!link.action || link.action === 'url') && this.field(t('admin.link_url'), this.input(link.url, (value) => { link.url = value; update(); })),
        this.field(t('admin.icon'), this.input(link.icon, (value) => { link.icon = value; update(); })),
        this.field(t('admin.icon_image'), this.input(link.iconImage, (value) => { link.iconImage = value; update(); })),
        m('div.Form-group', m(Switch, { state: link.showIcon !== false, onchange: (value) => { link.showIcon = value; update(); } }, t('admin.show_icon'))),
        this.field(t('admin.audience'), this.select(link.audience || 'all', Object.fromEntries(audiences.map((key) => [key, t('admin.audiences.' + key)])), (value) => { link.audience = value; update(); })),
        m(Button, { className: 'Button Button--icon', icon: 'fas fa-arrow-up', disabled: !index, title: text('admin.move_up'), 'aria-label': text('admin.move_up'), onclick: () => { [links[index - 1], links[index]] = [links[index], links[index - 1]]; update(); } }),
        m(Button, { className: 'Button Button--icon', icon: 'fas fa-times', title: text('admin.remove'), 'aria-label': text('admin.remove'), onclick: () => { links.splice(index, 1); update(); } }),
      ])),
      m(Button, { className: 'Button Button--text', icon: 'fas fa-plus', disabled: links.length >= 12, onclick: () => { links.push({ action: 'url', label: '', url: '', icon: '', audience: 'all' }); update(); } }, t('admin.add_link')),
    ]);
  }

  alignmentOptions() {
    return Object.fromEntries(['left','center','right'].map((name) => [name, t('admin.align.' + name)]));
  }

  rowControls(items, index, update) {
    return m('div.DiyHomeEditor-rowControls', [
      m(Button, { className: 'Button Button--icon', icon: 'fas fa-arrow-up', title: text('admin.move_up'), disabled: index === 0, onclick: () => { [items[index - 1], items[index]] = [items[index], items[index - 1]]; update(); } }),
      m(Button, { className: 'Button Button--icon', icon: 'fas fa-arrow-down', title: text('admin.move_down'), disabled: index === items.length - 1, onclick: () => { [items[index + 1], items[index]] = [items[index], items[index + 1]]; update(); } }),
      m(Button, { className: 'Button Button--icon', icon: 'fas fa-times', title: text('admin.remove'), onclick: () => { items.splice(index, 1); update(); } }),
    ]);
  }

  textsEditor(widget) {
    const blocks = textBlocks(widget);
    const update = () => this.update(widget, 'texts', blocks, true);
    return m('div.DiyHomeEditor-texts', [
      m('p.helpText', t('admin.texts_help')),
      blocks.map((block, i) => m('details.DiyHomeEditor-row', [
        m('summary', (i + 1) + ' · ' + (block.text || text('admin.new_text')).slice(0, 70)),
        this.field(t('admin.fields.text'), m('textarea.FormControl', { rows: 3, value: block.text, oninput: (event) => { block.text = event.target.value; update(); } })),
        m('div.DiyHomeEditor-fieldGrid', [
          this.field(t('admin.text_kind'), this.select(block.kind || 'body', Object.fromEntries(['eyebrow','title','body','caption','custom'].map((name) => [name, t('admin.text_kinds.' + name)])), (value) => { block.kind = value; update(); })),
          this.field(t('admin.text_position'), this.select(block.position || 'beforeActions', Object.fromEntries(['beforeActions','afterActions'].map((name) => [name, t('admin.positions.' + name)])), (value) => { block.position = value; update(); })),
          this.field(t('admin.text_align'), this.select(block.align || 'left', this.alignmentOptions(), (value) => { block.align = value; update(); })),
          this.field(t('admin.content_safe_width'), this.number(block.safeWidth ?? '', (value) => { block.safeWidth = value; update(); }, 1, 100, 1, text('admin.default_safe_width')), t('admin.content_safe_width_help')),
          this.field(t('admin.text_margin_bottom'), this.number(block.marginBottom ?? '', (value) => { block.marginBottom = value; update(); }, 0, 120, 1, text('admin.default_margin_bottom')), t('admin.text_margin_bottom_help')),
        ]),
        block.kind === 'custom' && m('div.DiyHomeEditor-fieldGrid', [
          this.field(t('admin.custom_font_size'), this.number(block.fontSize ?? '', (value) => { block.fontSize = value; update(); }, 12, 120, 1, text('admin.custom_font_default_size')), t('admin.custom_font_size_help')),
          this.field(t('admin.custom_font_family'), this.input(block.fontFamily, (value) => { block.fontFamily = value; update(); }, { maxlength: 300, placeholder: text('admin.custom_font_default_family') }), t('admin.custom_font_family_help')),
        ]),
        block.kind === 'custom' && m('div.DiyHomeEditor-themeColumns', ['light', 'dark'].map((theme) => m('fieldset.DiyHomeEditor-themeColumn', { 'data-background-theme': theme }, [
          m('legend', t('admin.background_themes.' + theme)),
          this.field(t('admin.custom_font_color'), m('span.DiyHomeEditor-colorControl', [
            m('span', { className: 'DiyHomeEditor-colorSwatch' + (safeColor(block.fontColor?.[theme]) ? '' : ' DiyHomeEditor-colorSwatch--inherit'), style: safeColor(block.fontColor?.[theme]) ? { backgroundColor: safeColor(block.fontColor[theme]) } : {}, 'aria-hidden': 'true' }),
            this.input(block.fontColor?.[theme] ?? '', (value) => {
            (block.fontColor ||= {})[theme] = value.trim();
            update();
            }, { maxlength: 9, placeholder: text('admin.theme_default') + ' / #rrggbb' }),
          ]), t('admin.custom_font_color_help')),
        ]))),
        m('div.Form-group', m(Switch, { state: !!block.showIcon, onchange: (value) => { block.showIcon = value; update(); } }, t('admin.show_icon'))),
        this.field(t('admin.icon'), this.input(block.icon, (value) => { block.icon = value; update(); })),
        this.field(t('admin.icon_image'), this.input(block.iconImage, (value) => { block.iconImage = value; update(); })),
        this.rowControls(blocks, i, update),
      ])),
      m(Button, { className: 'Button Button--text', icon: 'fas fa-plus', disabled: blocks.length >= 20, onclick: () => { blocks.push({ text: '', kind: 'body', position: 'beforeActions', align: 'left', showIcon: false }); update(); } }, t('admin.add_text')),
    ]);
  }

  backgroundEditor(widget) {
    const bg = widget.background || {};
    const update = (key, value) => this.nested(widget, 'background', key, value);
    return this.section('background', [
      widget.type === 'banner' && this.field(t('admin.fields.imageUrl'), this.input(widget.settings?.imageUrl, (value) => this.update(widget, 'imageUrl', value, true)), t('admin.field_help.imageUrl')),
      this.field(t('admin.background_mode'), this.select(bg.mode || 'theme', Object.fromEntries(['theme','solid','gradient'].map((name) => [name, t('admin.background_modes.' + name)])), (value) => update('mode', value))),
      bg.mode && bg.mode !== 'theme' && m('div.DiyHomeEditor-themeColumns', ['light', 'dark'].map((theme) => {
        const palette = backgroundPalette(bg, theme);
        const change = (name, value) => {
          ((widget.background ||= {})[theme] ||= {})[name] = value;
          this.commit();
        };
        return m('fieldset.DiyHomeEditor-themeColumn', { 'data-background-theme': theme }, [
          m('legend', t('admin.background_themes.' + theme)),
          ...['leftColor','rightColor','leftImage','rightImage'].filter((name) => bg.mode === 'gradient' || !name.startsWith('right')).map((name) => this.field(t('admin.background.' + name), this.input(palette[name], (value) => change(name, value), { placeholder: name.includes('Color') ? text('admin.theme_default') + ' / #rrggbb' : '/path or https://…' }))),
          ...(bg.mode === 'gradient' ? [['angle',115,0,360],['position',50,0,100],['width',70,0,100]] : []).map(([name,fallback,min,max]) => this.field(t('admin.background.' + name), this.number(palette[name] ?? fallback, (value) => change(name, value), min, max))),
          ...[['imageX',50,0,100,1],['imageY',50,0,100,1],['imageOpacity',1,0,1,.05]].map(([name,fallback,min,max,step]) => this.field(t('admin.background.' + name), this.number(palette[name] ?? fallback, (value) => change(name, value), min, max, step))),
          this.field(t('admin.background.imageFit'), this.select(palette.imageFit || 'cover', { cover: 'cover', contain: 'contain', manual: t('admin.image_fit_manual') }, (value) => change('imageFit', value))),
          palette.imageFit === 'manual' && this.field(t('admin.background.imageScale'), this.number(palette.imageScale ?? 100, (value) => change('imageScale', value), 1, 500, 1), t('admin.image_scale_help')),
        ]);
      })),
      m('p.helpText', t('admin.background_help')),
    ]);
  }

  decorationEditor(widget) {
    const deco = widget.settings?.decoration || {};
    const update = (key, value) => this.nested(widget, 'decoration', key, value, true);
    return this.section('decoration', [
      m('div.Form-group', m(Switch, { state: deco.enabled !== false, onchange: (value) => update('enabled', value) }, t('admin.decoration.enabled'))),
      deco.enabled !== false && [
        m('div.Form-group', m(Switch, { state: deco.orbits !== false, onchange: (value) => update('orbits', value) }, t('admin.decoration.orbits'))),
        this.field(t('admin.icon'), this.input(deco.icon ?? widget.icon, (value) => update('icon', value))),
        this.field(t('admin.icon_image'), this.input(deco.imageUrl, (value) => update('imageUrl', value))),
        m('div.DiyHomeEditor-fieldGrid', [
          ...[['size',140,24,400,1],['opacity',.5,0,1,.05],['x',88,0,100,1],['y',50,0,100,1]].map(([name,fallback,min,max,step]) => this.field(t('admin.decoration.' + name), this.number(deco[name] ?? fallback, (value) => update(name, value), min, max, step))),
        ]),
      ],
    ]);
  }

  statsEditor(widget) {
    const items = widget.settings?.stats || defaultStats();
    const update = () => this.update(widget, 'stats', items, true);
    const metrics = ['users','discussions','posts','online','recentPosts','recentUsers','recentDiscussions','postType','tagDiscussions'];
    return m('div.DiyHomeEditor-stats', [
      m('p.helpText', t('admin.stats_help')),
      items.map((item, i) => m('details.DiyHomeEditor-row', [
        m('summary', [item.enabled === false ? '○ ' : '● ', item.label || t('admin.metrics.' + item.metric)]),
        m('div.Form-group', m(Switch, { state: item.enabled !== false, onchange: (value) => { item.enabled = value; update(); } }, t('admin.enabled'))),
        this.field(t('admin.metric'), this.select(item.metric, Object.fromEntries(metrics.map((metric) => [metric, t('admin.metrics.' + metric)])), (value) => { item.metric = value; update(); })),
        this.field(t('admin.stat_label'), this.input(item.label, (value) => { item.label = value; update(); }, { placeholder: text('admin.automatic') })),
        this.field(t('admin.icon'), this.input(item.icon, (value) => { item.icon = value; update(); })),
        item.metric.startsWith('recent') && this.field(t('admin.days'), this.number(item.days ?? 7, (value) => { item.days = value; update(); }, 1, 365)),
        item.metric === 'online' && this.field(t('admin.minutes'), this.number(item.minutes ?? 5, (value) => { item.minutes = value; update(); }, 1, 60)),
        item.metric === 'postType' && this.field(t('admin.post_type'), this.input(item.postType || 'comment', (value) => { item.postType = value; update(); })),
        item.metric === 'tagDiscussions' && this.field(t('admin.tag_slug'), this.input(item.tag, (value) => { item.tag = value; update(); })),
        this.rowControls(items, i, update),
      ])),
      m(Button, { className: 'Button Button--text', icon: 'fas fa-plus', disabled: items.length >= 12, onclick: () => { items.push({ id: 'stat-' + Date.now().toString(36), metric: 'recentDiscussions', days: 7, enabled: true, icon: 'far fa-comments' }); update(); } }, t('admin.add_stat')),
    ]);
  }
}

import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Background from './Background';
import WidgetHeading from './WidgetHeading';
import { emphasizedTitle, radiusStyle } from '../../common/presentation';
import { widgetTitle, visible } from '../../common/utils';

export default class WidgetCard extends Component {
  view() {
    const widget = this.attrs.widget;
    const definition = app.diyHomepage.get(widget.type);
    if (!definition?.component || widget.enabled === false || !visible(widget.audience)) return null;
    if (definition.isAvailable && !definition.isAvailable(widget)) return null;

    const standalone = ['banner', 'fof', 'divider'].includes(widget.type);
    const ownsHeading = widget.type !== 'fof' || widget.overrideHeading === true;
    const emphasized = ownsHeading && emphasizedTitle(widget);
    return m('section', {
      className: 'DiyHome-widget DiyHome-widget--' + widget.type + (standalone ? ' DiyHome-widget--standalone' : '') + (widget.noBottomPadding ? ' DiyHome-widget--noBottomPadding' : '') + (widget.noBottomMargin ? ' DiyHome-widget--noBottomMargin' : '') + (ownsHeading ? (emphasized ? ' DiyHome-widget--emphasized' : ' DiyHome-widget--fofTitles') : ''),
      style: { ...radiusStyle(), ...(widget.loadingHeight ? { '--diy-home-loading-height': widget.loadingHeight + 'px' } : {}) },
      'data-home-widget': widget.id,
      'aria-label': widgetTitle(widget),
    }, [
      widget.type !== 'fof' && m(WidgetHeading, { widget }),
      standalone ? m(definition.component, { widget, settings: widget.settings || {} })
        : m('div.DiyHome-widgetContent', { className: widget.background?.mode && widget.background.mode !== 'theme' ? 'DiyHome-widgetContent--custom' : '' }, [
          m(Background, { background: widget.background }),
          m('div.DiyHome-surfaceForeground', m(definition.component, { widget, settings: widget.settings || {} })),
        ]),
    ]);
  }
}

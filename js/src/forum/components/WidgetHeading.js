import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import Icon from 'flarum/common/components/Icon';
import WidgetIcon from './WidgetIcon';
import { t, widgetTitle, safeUrl, linkAttrs, displayText } from '../../common/utils';

// Shared heading for native widgets and explicitly opted-in FoF imports.
export default class WidgetHeading extends Component {
  view() {
    const widget = this.attrs.widget;
    if (widget.showTitle === false) return null;
    const definition = app.diyHomepage.get(widget.type);
    const url = safeUrl(widget.linkUrl);
    return m('header.DiyHome-widgetHeader', [
      m('div.DiyHome-heading', [
        m('div.FofWidgets-Widget-title', [
          widget.showIcon !== false && m(WidgetIcon, { icon: widget.icon || definition.icon, image: widget.iconImage, className: 'FofWidgets-Widget-title-icon DiyHome-headingIcon' }),
          m('span.FofWidgets-Widget-title-label', widgetTitle(widget)),
        ]),
        widget.subtitle && m('div.FofWidgets-Widget-title-desc.DiyHome-subtitle', displayText(widget.subtitle)),
      ]),
      url && m(Link, { ...linkAttrs(url), className: 'DiyHome-more' }, [
        widget.linkLabel ? displayText(widget.linkLabel) : t('forum.view_all'), m(Icon, { name: 'fas fa-arrow-right' }),
      ]),
    ]);
  }
}

import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import WidgetIcon from './WidgetIcon';
import IndexSidebar from 'flarum/forum/components/IndexSidebar';
import { t, safeUrl, visible, linkAttrs } from '../../common/utils';

export default class ActionLink extends Component {
  view() {
    const item = this.attrs.item;
    if (!visible(item.audience)) return null;
    const action = item.action || 'url';
    const url = action === 'all' ? app.route('index') : action === 'url' ? safeUrl(item.url) : null;
    const label = item.label || t('lib.actions.' + action);
    const contents = [item.showIcon !== false && m(WidgetIcon, { icon: item.icon, image: item.iconImage }), m('span', label)];
    const className = this.attrs.className || 'DiyHome-action';

    if (url) return m(Link, { ...linkAttrs(url), className }, contents);
    if (!['signup', 'login', 'compose'].includes(action)) return null;
    if (app.session.user && ['signup', 'login'].includes(action)) return null;
    return m(Button, {
      className,
      type: 'button',
      onclick: () => {
        if (action === 'compose') return IndexSidebar.prototype.newDiscussionAction.call(null).catch(() => {});
        if (action === 'signup') app.modal.show(() => import('flarum/forum/components/SignUpModal'));
        if (action === 'login') app.modal.show(() => import('flarum/forum/components/LogInModal'));
      },
    }, contents);
  }
}

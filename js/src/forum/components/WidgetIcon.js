import Icon from 'flarum/common/components/Icon';
import Component from 'flarum/common/Component';
import { safeUrl } from '../../common/utils';

export default class WidgetIcon extends Component {
  view() {
    const { icon, image, className = '' } = this.attrs;
    const src = safeUrl(image);
    return src ? m('img.DiyHome-iconImage', { src, alt: '', className, loading: 'lazy' })
      : icon ? m(Icon, { name: icon, className }) : null;
  }
}

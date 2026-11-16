import Component from 'flarum/common/Component';

export default class HtmlWidget extends Component {
  view() {
    const html = this.attrs.settings.html;
    // Only administrators can save this trusted HTML. Do not interpolate actor
    // data here, sanitize it implicitly, or recreate script elements to run them.
    return m('div.DiyHome-html', m.trust(typeof html === 'string' ? html : ''));
  }
}

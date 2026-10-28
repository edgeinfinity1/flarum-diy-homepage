import app from 'flarum/forum/app';
import Hero from 'flarum/forum/components/Hero';
import ItemList from 'flarum/common/utils/ItemList';
import { text, displayText } from '../../common/utils';
import WidgetIcon from './WidgetIcon';

export default class HomeHero extends Hero {
  className() {
    return 'WelcomeHero DiyHome-hero';
  }

  bodyItems() {
    const items = new ItemList();
    const subtitle = app.forum.attribute('diyHomepage.heroSubtitle') || '';
    const title = app.forum.attribute('diyHomepage.heroTitle') || '';
    items.add('content', m('div.containerNarrow', [
      m('h1.Hero-title', [
        app.forum.attribute('diyHomepage.heroShowIcon') !== false && m('span.DiyHome-heroIcon', { 'aria-hidden': 'true' }, m(WidgetIcon, {
          icon: app.forum.attribute('diyHomepage.heroIcon'), image: app.forum.attribute('diyHomepage.heroIconImage'),
        })),
        m('span.DiyHome-heroTitle', title.trim() ? displayText(title) : app.forum.attribute('diyHomepage.navLabel') || text('forum.home')),
      ]),
      subtitle.trim() && m('div.Hero-subtitle', displayText(subtitle)),
    ]));
    return items;
  }
}

import app from 'flarum/forum/app';
import Page from 'flarum/common/components/Page';
import IndexSidebar from 'flarum/forum/components/IndexSidebar';
import HomePageStructure from './HomePageStructure';
import HomeHero from './HomeHero';
import WidgetCard from './WidgetCard';
import { text, parseConfig, visible } from '../../common/utils';

export default class HomePage extends Page {
  // Extensions may opt these sidebar controls in without importing this package.
  static providesIndexSidebar = true;

  oninit(vnode) {
    super.oninit(vnode);
    this.bodyClass = 'App--index App--diy-homepage';
    this.config = parseConfig(app.forum.attribute('diyHomepage.config'));
    const historyName = app.forum.attribute('defaultRoute') === '/home' ? 'homeDefault' : 'home';
    app.history.push(historyName, app.forum.attribute('diyHomepage.navLabel') || text('forum.home'));
  }

  oncreate(vnode) {
    super.oncreate(vnode);
    app.setTitle(app.forum.attribute('diyHomepage.navLabel') || text('forum.home'));
    app.setTitleCount(0);
  }

  region(region) {
    return this.config.widgets.filter((widget) => widget.region === region && widget.enabled !== false && visible(widget.audience))
      .map((widget) => m(WidgetCard, { key: widget.id, widget }));
  }

  view() {
    const sidebar = this.region('sidebar');
    return m(HomePageStructure, {
      className: 'IndexPage DiyHomePage',
      hero: () => m(HomeHero),
      fullWidth: () => this.region('fullWidth'),
      sidebar: () => m(IndexSidebar),
    }, [
      m('div.DiyHome-top', this.region('top')),
      m('div.DiyHome-grid', { className: sidebar.length ? '' : 'DiyHome-grid--single' }, [
        m('div.DiyHome-main', this.region('main')),
        sidebar.length > 0 && m('aside.DiyHome-sidebar', {
          className: app.forum.attribute('diyHomepage.stickySidebar') ? 'DiyHome-sidebar--sticky' : '',
          'aria-label': text('forum.sidebar'),
        }, sidebar),
      ]),
      !this.config.widgets.some((widget) => ['fullWidth', 'top', 'main', 'sidebar'].includes(widget.region)
        && widget.enabled !== false && visible(widget.audience)) && m('p.DiyHome-empty', text('forum.empty_home')),
    ]);
  }
}

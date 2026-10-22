import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import IndexSidebar from 'flarum/forum/components/IndexSidebar';
import PageStructure from 'flarum/forum/components/PageStructure';
import LinkButton from 'flarum/common/components/LinkButton';
import WidgetRegistry from '../common/WidgetRegistry';
import registerBuiltins from '../common/definitions';
import registerFoFWidgets from '../common/fofBridge';
import { t, parseConfig } from '../common/utils';
import HomePage from './components/HomePage';
import WidgetCard from './components/WidgetCard';
import sidebarDropdowns from './sidebarDropdowns';
import { BannerWidget, ImageWidget, NoticeWidget, LinksWidget, SearchWidget, FoFWidget } from './components/ContentWidgets';
import { DiscussionsWidget, UsersWidget, StatsWidget } from './components/DataWidgets';

app.diyHomepage = new WidgetRegistry();
registerBuiltins(app.diyHomepage);
const components = { banner: BannerWidget, image: ImageWidget, notice: NoticeWidget, links: LinksWidget,
  search: SearchWidget, fof: FoFWidget, discussions: DiscussionsWidget, users: UsersWidget, stats: StatsWidget };
Object.entries(components).forEach(([type, component]) => { app.diyHomepage.get(type).component = component; });

app.initializers.add('edgeinfinity/diy-homepage', () => {
  sidebarDropdowns();
  const attributes = app.data.resources.find((resource) => resource.type === 'forums')?.attributes || {};
  app.routes.home = { path: '/home', component: HomePage };
  if (attributes.defaultRoute === '/home') {
    // Core remaps the last default route to /. Keep the named /home route as a stable alias.
    app.routes.homeDefault = { path: '/home', component: HomePage };
  }

  extend(IndexSidebar.prototype, 'navItems', function (items) {
    const onHome = app.current.matches(HomePage);
    items.add('diyHomepage', m(LinkButton, {
      href: app.route('home'), icon: 'fas fa-house', active: onHome,
    }, app.forum.attribute('diyHomepage.navLabel') || t('forum.home')), 110);
    // An index with no search must not be marked active while the home page is open.
    if (onHome && items.has('allDiscussions')) items.get('allDiscussions').attrs.active = false;
  });

  // Opt in for providers that use onWidgetPage(), but render non-left placements ourselves.
  app.widgets?.addPage(HomePage);
  extend(PageStructure.prototype, 'mainItems', function (items) {
    const pageClass = this.attrs.className || '';
    if (app.forum.attribute('diyHomepage.heroEnabled') === false && /\bIndexPage\b/.test(pageClass)) {
      items.remove('hero');
    }
    if (app.current.matches(HomePage)) {
      items.remove('topWidgetSection');
      items.remove('bottomWidgetSection');
    }
  });
  extend(PageStructure.prototype, 'containerItems', function (items) {
    if (app.current.matches(HomePage)) items.remove('endWidgetSection');
  });
  registerFoFWidgets(app, parseConfig(attributes['diyHomepage.config']), WidgetCard);
}, -20);

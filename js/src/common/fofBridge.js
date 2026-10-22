import Component from 'flarum/common/Component';
import { visible, widgetTitle } from './utils';

// Export configured native instances, never imported FoF widgets: that prevents bridge recursion.
export default function registerFoFWidgets(app, config, WidgetCard = null) {
  if (!app.widgets?.add) return;
  config.widgets.filter((widget) => widget.type !== 'fof' && widget.enabled !== false && app.diyHomepage.get(widget.type)).forEach((widget) => {
    const definition = app.diyHomepage.get(widget.type);
    class HomepageAdapter extends Component {
      view() {
        // Configuration-only instances keep their own appearance and content in FoF.
        return WidgetCard ? m(WidgetCard, { widget }) : null;
      }
    }
    app.widgets.add({
      key: 'home-' + widget.id,
      title: () => widgetTitle(widget),
      icon: widget.icon || definition.icon || 'fas fa-house',
      component: HomepageAdapter,
      isUnique: true,
      isDisabled: () => !visible(widget.audience),
      placement: 'store',
      position: 0,
    }, 'edgeinfinity-diy-homepage');
  });
}

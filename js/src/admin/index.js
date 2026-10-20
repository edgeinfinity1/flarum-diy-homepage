import app from 'flarum/admin/app';
import { override } from 'flarum/common/extend';
import WidgetRegistry from '../common/WidgetRegistry';
import registerBuiltins from '../common/definitions';
import registerFoFWidgets from '../common/fofBridge';
import { parseConfig } from '../common/utils';
import HomeSettingsPage from './components/HomeSettingsPage';

app.diyHomepage = new WidgetRegistry();
registerBuiltins(app.diyHomepage);

app.initializers.add('edgeinfinity/diy-homepage', () => {
  app.registry.for('edgeinfinity-diy-homepage').registerPage(HomeSettingsPage);
  app.registry.for('edgeinfinity-diy-homepage').registerPermission({
    icon: 'fas fa-user-clock',
    label: app.translator.trans('edgeinfinity-diy-homepage.admin.online_permission'),
    permission: 'edgeinfinity-diy-homepage.viewOnlineCount',
    allowGuest: true,
  }, 'view');
  registerFoFWidgets(app, parseConfig(app.data.settings['edgeinfinity-diy-homepage.config']));
  if (app.widgets) {
    // FoF 2.0.2 assumes every unique type starts in a real placement. Our opt-in
    // exports start in its store, so make an unplaced export available to drag.
    override('ext:fof/forum-widgets-core/admin/components/WidgetEditor', 'isWidgetAvailable', function (original, widget) {
      if (widget.extension !== 'edgeinfinity-diy-homepage') return original(widget);
      return !(this.config.instances || []).some((instance) => instance.id === widget.id)
        || (this.config.disabled || []).includes(widget.id);
    });
  }
}, -20);

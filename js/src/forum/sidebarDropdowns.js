import { extend } from 'flarum/common/extend';
import Dropdown from 'flarum/common/components/Dropdown';

// Keep native menus in their component/DOM tree while escaping the sticky
// sidebar's scroll clip. The core still handles items, focus and dismissal.
export default function sidebarDropdowns() {
  extend(Dropdown.prototype, 'oncreate', function () {
    this.$().on('shown.bs.dropdown.diyHomeSidebar', () => {
      this.diyHomeMenuCleanup?.();
      const sidebar = this.element.closest('.DiyHome-sidebar--sticky');
      if (!sidebar || getComputedStyle(sidebar).overflowY !== 'auto') return;
      const menu = this.$('.Dropdown-menu')[0];
      if (!menu) return;

      const rect = menu.getBoundingClientRect();
      const previous = menu.getAttribute('style');
      Object.assign(menu.style, {
        position: 'fixed',
        top: Math.max(8, Math.min(rect.top, innerHeight - Math.min(rect.height, innerHeight - 16) - 8)) + 'px',
        left: Math.max(8, Math.min(rect.left, innerWidth - rect.width - 8)) + 'px',
        right: 'auto', bottom: 'auto', margin: '0',
        maxHeight: 'calc(100dvh - 16px)', overflowY: 'auto',
      });
      const toggle = this.$('.Dropdown-toggle')[0];
      const anchor = toggle.getBoundingClientRect();

      // A fixed menu must close if its anchor moves; scrolling inside the menu
      // remains available for long action lists.
      const close = (event) => {
        if (event.type === 'scroll' && event.target instanceof Node && menu.contains(event.target)) return;
        if (event.type === 'scroll') {
          // A queued scroll from revealing the row may arrive after opening.
          const current = toggle.getBoundingClientRect();
          if (current.left === anchor.left && current.top === anchor.top) return;
        }
        if (this.$().hasClass('open')) this.$('.Dropdown-toggle').first().dropdown('toggle');
      };
      window.addEventListener('scroll', close, true);
      window.addEventListener('resize', close);
      this.diyHomeMenuCleanup = () => {
        window.removeEventListener('scroll', close, true);
        window.removeEventListener('resize', close);
        if (previous === null) menu.removeAttribute('style');
        else menu.setAttribute('style', previous);
        this.diyHomeMenuCleanup = null;
      };
    });
    this.$().on('hidden.bs.dropdown.diyHomeSidebar', () => this.diyHomeMenuCleanup?.());
  });

  extend(Dropdown.prototype, 'onremove', function () {
    this.diyHomeMenuCleanup?.();
    this.$().off('.diyHomeSidebar');
  });
}

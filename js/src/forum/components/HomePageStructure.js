import app from 'flarum/forum/app';
import PageStructure from 'flarum/forum/components/PageStructure';

export default class HomePageStructure extends PageStructure {
  mainItems() {
    const items = super.mainItems();
    const widgets = this.attrs.fullWidth();
    if (widgets.length) items.add('diyHomepageFullWidth', m('div.container.DiyHome-fullWidth', widgets), 50);
    return items;
  }
}

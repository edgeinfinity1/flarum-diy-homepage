import Component from 'flarum/common/Component';

// Keep the final width and accessible value throughout the visual animation.
export default class CountUp extends Component {
  oncreate(vnode) {
    super.oncreate(vnode);
    this.start();
  }

  onupdate(vnode) {
    super.onupdate(vnode);
    if (this.value !== Number(this.attrs.value) || this.animate !== this.attrs.animate) this.start();
  }

  start() {
    cancelAnimationFrame(this.frame);
    this.value = Number(this.attrs.value) || 0;
    this.animate = this.attrs.animate;
    const output = this.element.querySelector('.DiyHome-countValue');
    if (!this.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      output.textContent = this.value.toLocaleString();
      return;
    }
    const start = performance.now();
    output.textContent = '0';
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 850);
      output.textContent = Math.round(this.value * (1 - Math.pow(1 - progress, 3))).toLocaleString();
      if (progress < 1) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  onremove(vnode) {
    cancelAnimationFrame(this.frame);
    super.onremove(vnode);
  }

  view() {
    const value = (Number(this.attrs.value) || 0).toLocaleString();
    return m('span.DiyHome-count', { 'aria-label': value }, [
      m('span.DiyHome-countWidth', { 'aria-hidden': 'true' }, value),
      m('span.DiyHome-countValue', { 'aria-hidden': 'true' }, value),
    ]);
  }
}

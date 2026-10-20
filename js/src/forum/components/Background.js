import Component from 'flarum/common/Component';
import { safeUrl } from '../../common/utils';
import { backgroundPalette, bounded, safeColor } from '../../common/presentation';

export default class Background extends Component {
  view() {
    const background = this.attrs.background || {};
    if (!['solid', 'gradient'].includes(background.mode)) return null;
    return m('div.DiyHome-background', { 'aria-hidden': 'true' }, ['light', 'dark'].map((theme) =>
      this.layer(backgroundPalette(background, theme), background.mode, theme)));
  }

  layer(background, mode, theme) {
    const left = safeColor(background.leftColor) || 'var(--control-bg)';
    const right = safeColor(background.rightColor) || 'var(--body-bg)';
    const angle = bounded(background.angle, 115, 0, 360);
    const center = bounded(background.position, 50, 0, 100);
    const width = bounded(background.width, 70, 0, 100);
    const from = Math.max(0, center - width / 2);
    const to = Math.min(100, center + width / 2);
    const gradient = mode === 'gradient';
    const mask = `linear-gradient(${angle}deg, #000 ${from}%, transparent ${to}%)`;
    const inverse = `linear-gradient(${angle}deg, transparent ${from}%, #000 ${to}%)`;
    const manual = background.imageFit === 'manual';
    const x = bounded(background.imageX, 50, 0, 100) + '%';
    const y = bounded(background.imageY, 50, 0, 100) + '%';
    const images = [safeUrl(background.leftImage), gradient && safeUrl(background.rightImage)];
    return m('div.DiyHome-backgroundLayer', { className: 'DiyHome-backgroundLayer--' + theme, style: {
      background: gradient ? `linear-gradient(${angle}deg, ${left} ${from}%, ${right} ${to}%)` : left,
    } }, images.map((src, i) => src && m('div.DiyHome-backgroundImage', { style: {
      ...(!manual ? { backgroundImage: `url("${src.replace(/"/g, '%22')}")` } : {}),
      backgroundRepeat: 'no-repeat',
      backgroundSize: background.imageFit === 'contain' ? 'contain' : 'cover',
      backgroundPosition: x + ' ' + y,
      ...(gradient ? { maskImage: i ? inverse : mask, WebkitMaskImage: i ? inverse : mask } : {}),
      opacity: bounded(background.imageOpacity, 1, 0, 1),
    } }, manual ? m('img.DiyHome-backgroundManualImage', { src, alt: '', decoding: 'async', draggable: false, style: {
      minWidth: bounded(background.imageScale, 100, 1, 500) + '%',
      left: x, transform: `translateX(-${x})`, objectPosition: x + ' ' + y,
    } }) : null)));
  }
}

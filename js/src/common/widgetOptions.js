export function actionClass(item, fallback = 'DiyHome-action') {
  return item.style === 'primary' ? 'Button Button--primary'
    : item.style === 'secondary' ? 'Button DiyHome-secondaryAction' : fallback;
}

export function statsFontStyle(settings, part) {
  const prefix = part === 'number' ? 'statsNumber' : 'statsLabel';
  const size = settings[prefix + 'FontSize'];
  const family = settings[prefix + 'FontFamily'];
  const weight = settings[prefix + 'FontWeight'];
  return {
    ...(size !== '' && size != null && Number.isFinite(Number(size)) ? { fontSize: Math.max(8, Math.min(120, Number(size))) + 'px' } : {}),
    ...(typeof family === 'string' && family && !/[;{}<>\\\u0000-\u001f]/.test(family) ? { fontFamily: family } : {}),
    ...(['normal', 'bold', '100', '200', '300', '400', '500', '600', '650', '700', '800', '900'].includes(String(weight)) ? { fontWeight: weight } : {}),
  };
}

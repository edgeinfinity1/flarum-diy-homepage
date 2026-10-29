// Cache per provider and renderer so redraws preserve the component instance.
// Only the imported subclass owns this header; provider prototypes and FoF's
// registry remain untouched, including other placements of the same provider.
const adapters = new WeakMap();
export function withFofHeading(Provider, renderHeading) {
  if (typeof Provider !== 'function' || typeof Provider.prototype?.header !== 'function') return null;
  let renderers = adapters.get(Provider);
  if (!renderers) adapters.set(Provider, renderers = new WeakMap());
  if (!renderers.has(renderHeading)) {
    renderers.set(renderHeading, class extends Provider {
      header(...args) {
        const widget = this.attrs.diyHomepageWidget;
        return widget?.overrideHeading === true ? renderHeading(widget) : super.header(...args);
      }
    });
  }
  return renderers.get(renderHeading);
}

export default class WidgetRegistry {
  constructor() {
    this.types = new Map();
  }

  register(type, definition) {
    if (!/^[a-zA-Z0-9_.:-]{1,100}$/.test(type)) throw new Error('Invalid homepage widget type: ' + type);
    if (this.types.has(type)) throw new Error('Homepage widget type is already registered: ' + type);
    this.types.set(type, definition);
    return this;
  }

  get(type) {
    return this.types.get(type);
  }

  all() {
    return [...this.types.entries()];
  }
}

// Deliberately limited to plain display text. Never interpolate URLs, search
// queries, CSS, HTML or translation templates. Substitution is single-pass.
export function interpolateText(value, variables) {
  if (typeof value !== 'string') return value;
  return value.replace(/\{\{([a-zA-Z][a-zA-Z0-9]*)\}\}|\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, literal, name) => {
    if (literal) return '{' + literal + '}';
    return Object.prototype.hasOwnProperty.call(variables, name) ? String(variables[name] ?? '') : match;
  });
}

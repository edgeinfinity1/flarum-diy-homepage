// Display-text tokens accept an optional JSON string fallback. Scan complete
// brace groups so quoted braces and malformed/nested expressions stay intact.
// Nothing is evaluated as code/HTML, and inserted values are never rescanned.
const own = (object, name) => Object.prototype.hasOwnProperty.call(object, name);
const empty = (value) => value == null || value === '';

function tokenEnd(text, start) {
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char.charCodeAt(0) === 92) escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return i + 1;
  }
  return -1;
}

export function interpolateText(value, variables, defaults = {}) {
  if (typeof value !== 'string') return value;
  const result = [];
  let cursor = 0;
  while (cursor < value.length) {
    const start = value.indexOf('{', cursor);
    if (start < 0) break;
    const end = tokenEnd(value, start);
    if (end < 0) break;
    result.push(value.slice(cursor, start));
    const token = value.slice(start, end);
    const literal = token.startsWith('{{') && token.endsWith('}}');
    const body = token.slice(literal ? 2 : 1, literal ? -2 : -1);
    const match = body.match(/^[ \t]*([a-zA-Z][a-zA-Z0-9]*)[ \t]*(?:,[ \t]*("(?:[^"\\\r\n]|\\.)*")[ \t]*)?$/);
    let replacement = token;
    if (match) {
      const [, name, fallback] = match;
      try {
        const fallbackText = fallback === undefined ? undefined : JSON.parse(fallback);
        if (literal) replacement = token.slice(1, -1);
        else if (own(variables, name)) {
          const current = variables[name];
          replacement = String(!empty(current) ? current
            : fallbackText !== undefined ? fallbackText
              : own(defaults, name) ? defaults[name] ?? '' : '');
        }
      } catch {
        // Invalid JSON escapes remain visible for the author to correct.
      }
    }
    result.push(replacement);
    cursor = end;
  }
  result.push(value.slice(cursor));
  return result.join('');
}

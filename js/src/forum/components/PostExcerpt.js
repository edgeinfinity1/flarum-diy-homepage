import Component from 'flarum/common/Component';
import Link from 'flarum/common/components/Link';
import { externalUrl } from '../../common/utils';

// Keep only text and safe hyperlinks from Flarum's rendered post HTML. No raw
// HTML, images, event attributes, embeds or hidden spoiler content are inserted.
export function excerptNodes(html, maxLength = 360) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  doc.querySelectorAll('script,style,iframe,video,audio,svg,math,button,.spoiler,.spoiler-content,[data-s9e-spoiler]').forEach((node) => node.remove());
  let remaining = maxLength;
  let truncated = false;
  function visit(node, preserveLines = false) {
    if (remaining <= 0) { truncated = true; return null; }
    if (node.nodeType === Node.TEXT_NODE) {
      const value = preserveLines ? node.textContent : node.textContent.replace(/\s+/g, ' ');
      const result = value.slice(0, remaining);
      if (value.length > remaining) truncated = true;
      remaining -= result.length;
      return result;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    if (node.tagName === 'BR') return '\n';
    if (node.tagName === 'PRE') return [visit(doc.createTextNode(node.textContent.replace(/\r\n?/g, '\n')), true), '\n'];
    const children = [...node.childNodes].map((child) => visit(child));
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      try {
        const parsed = new URL(href, window.location.href);
        if (['http:', 'https:'].includes(parsed.protocol) && !/[\u0000-\u0020\u007f\\]/.test(href)) {
          // Use the post's original URL, not an admin-config forum-relative URL.
          return m(Link, { href: parsed.href, external: true, ...(externalUrl(parsed.href) ? { target: '_blank' } : {}), rel: 'nofollow ugc noopener noreferrer' }, children);
        }
      } catch {}
    }
    return [children, ['P', 'DIV', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TR'].includes(node.tagName) ? '\n' : null];
  }
  const content = [...doc.body.childNodes].map((child) => visit(child));
  if (truncated) content.push('…');
  return content;
}

export default class PostExcerpt extends Component {
  view() {
    return m('div.DiyHome-excerpt', excerptNodes(this.attrs.post?.contentHtml?.(), this.attrs.length || 360));
  }
}

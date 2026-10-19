// Small test-only DOM adapter. This is not a browser or a rendering engine.
const voidTags = new Set(['input', 'meta', 'link', 'br', 'hr', 'img']);
const decode = text => String(text).replace(/&(?:amp|lt|gt|quot|#39);/g, value => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }[value]));

class TextNode {
  constructor(text) { this.textContent = decode(text); this.parentNode = null; }
}

export class Element {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toLowerCase(); this.ownerDocument = ownerDocument;
    this.attributes = {}; this.childNodes = []; this.listeners = new Map(); this.style = {};
    this.hidden = false; this.disabled = false; this.checked = false; this.dataset = {};
    this.parentNode = null; this._value = undefined;
  }
  get id() { return this.attributes.id || ''; }
  set id(value) { this.attributes.id = value; }
  get children() { return this.childNodes.filter(node => node instanceof Element); }
  get textContent() { return this.childNodes.map(node => node.textContent).join(''); }
  set textContent(value) { this.replaceChildren(new TextNode(String(value))); }
  get innerHTML() { return this._html || ''; }
  set innerHTML(html) { this._html = html; this.replaceChildren(...parseHtml(html, this.ownerDocument)); }
  get value() {
    if (this._value !== undefined) return this._value;
    if (this.tagName === 'select') return this.querySelector('option')?.value || '';
    return this.attributes.value || '';
  }
  set value(value) { this._value = String(value); }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.startsWith('data-')) this.dataset[name.slice(5)] = String(value);
    if (['disabled', 'checked', 'hidden'].includes(name)) this[name] = true;
    if (['name', 'type'].includes(name)) this[name] = String(value);
  }
  getAttribute(name) { return this.attributes[name] ?? null; }
  append(...nodes) {
    for (let node of nodes) {
      if (typeof node === 'string') node = new TextNode(node);
      if (node.parentNode) node.parentNode.childNodes = node.parentNode.childNodes.filter(child => child !== node);
      node.parentNode = this; this.childNodes.push(node);
    }
  }
  replaceChildren(...nodes) {
    for (const node of this.childNodes) node.parentNode = null;
    this.childNodes = []; this.append(...nodes);
  }
  remove() {
    if (this.parentNode) this.parentNode.childNodes = this.parentNode.childNodes.filter(child => child !== this);
    this.parentNode = null;
  }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  removeEventListener(type, handler) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter(fn => fn !== handler));
  }
  dispatch(type) {
    const event = { type, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    for (const handler of [...(this.listeners.get(type) || [])]) handler(event);
    return event;
  }
  click() { if (!this.disabled) this.dispatch('click'); }
  focus() { this.ownerDocument.activeElement = this; }
  reset() {
    for (const input of this.querySelectorAll('input')) input.checked = false;
  }
  submit() {
    this.ownerDocument.submissions.push(Object.fromEntries(this.children.map(child => [child.name, child.value])));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) {
    const all = [];
    function visit(node) { for (const child of node.children) { all.push(child); visit(child); } }
    visit(this);
    return all.filter(node => selector.split(',').some(part => matchesChain(node, part.trim().split(/\s+/))));
  }
}

function matchesSimple(node, selector) {
  if (selector.startsWith('#')) return node.id === selector.slice(1);
  if (selector.startsWith('.')) return (node.attributes.class || '').split(/\s+/).includes(selector.slice(1));
  const match = selector.match(/^([a-z]+)?\[([a-z-]+)="([^"]*)"\]$/);
  if (match) return (!match[1] || node.tagName === match[1]) && node.getAttribute(match[2]) === match[3];
  return node.tagName === selector;
}
function matchesChain(node, parts) {
  if (!matchesSimple(node, parts[parts.length - 1])) return false;
  let current = node.parentNode;
  for (let i = parts.length - 2; i >= 0; i--) {
    while (current && !matchesSimple(current, parts[i])) current = current.parentNode;
    if (!current) return false;
    current = current.parentNode;
  }
  return true;
}

function parseHtml(html, document) {
  const root = new Element('fragment', document);
  const stack = [root];
  for (const token of String(html).match(/<!--[^]*?-->|<[^>]*>|[^<]+/g) || []) {
    if (token.startsWith('<!--') || token.startsWith('<!')) continue;
    if (token.startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
    if (token.startsWith('<')) {
      const tag = token.match(/^<([a-z][a-z0-9-]*)/i);
      if (!tag) continue;
      const element = document.createElement(tag[1]);
      const tail = token.slice(tag[0].length, -1);
      for (const attribute of tail.matchAll(/([a-zA-Z_:][a-zA-Z0-9_:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
        element.setAttribute(attribute[1], decode(attribute[2] ?? attribute[3] ?? attribute[4] ?? ''));
      }
      stack[stack.length - 1].append(element);
      if (!voidTags.has(element.tagName) && !token.endsWith('/>')) stack.push(element);
    } else stack[stack.length - 1].append(new TextNode(token));
  }
  return [...root.childNodes];
}

export function createDocument(html) {
  const document = { submissions: [], activeElement: null };
  document.createElement = tag => {
    const element = new Element(tag, document);
    if (tag === 'iframe') element.contentWindow = {};
    return element;
  };
  document.root = new Element('document', document);
  document.root.innerHTML = html.replace(/<script[^]*?<\/script>/g, '');
  document.body = document.root.querySelector('body') || document.root;
  document.querySelector = selector => document.root.querySelector(selector);
  document.querySelectorAll = selector => document.root.querySelectorAll(selector);
  document.getElementById = id => document.querySelector(`#${id}`);
  return document;
}

export class FormDataAdapter {
  constructor(form) {
    this.values = new Map();
    for (const input of form.querySelectorAll('input')) {
      if (input.name && !input.disabled && (!['radio', 'checkbox'].includes(input.type) || input.checked)) {
        this.values.set(input.name, input.value);
      }
    }
  }
  get(key) { return this.values.get(key) ?? null; }
  has(key) { return this.values.has(key); }
}

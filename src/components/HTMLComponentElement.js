import styles from '../styles.css' assert { type: 'css' };
document.adoptedStyleSheets.push(styles);

const templateElements = {};
const dashCaseRegex = /-([a-z])/g;
const onRegex = /^on/;
let templates = new Map();

export default class HTMLComponentElement extends HTMLElement {
  static tag = 'none';

  /** if not using shadowRoot templates and rendering still work */
  static useShadowRoot = false;
  static shadowRootDelegateFocus = false;
  static styleSheets = [];

  /** Use template element to clone from
   *   If your template uses dynamic variables you do not want to use this
   */
  static useTemplate = true;

  /** Extend observedAttributes to allow type information and handling */
  static get observedAttributesExtended() { return []; };
  static get observedAttributes() { return this.observedAttributesExtended.map(a => a[0]); }

  #prepared = false;
  #attributeEvents = {};
  #attributesLookup;
  #templateElement;


  constructor() {
    super();
    
    this.#attributesLookup = Object.fromEntries(this.constructor.observedAttributesExtended);

    if (this.constructor.useShadowRoot) {
      this.attachShadow({ mode: 'open', delegatesFocus: this.constructor.shadowRootDelegateFocus });
    } else if (this.constructor.styleSheets[0] instanceof CSSStyleSheet) {
      document.adoptedStyleSheets.push(...this.constructor.styleSheets);
    }
  }


  /** Default function used by extended version */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    const type = this.#attributesLookup[name];
    name = name.replace(dashCaseRegex, (_, s) => s.toUpperCase());
    if (type === 'event') {
      if (this.#attributeEvents[name]) {
        this.removeEventListener(name.replace(onRegex, ''), this.#attributeEvents[name]);
        this.#attributeEvents[name] = undefined;
      }
      if (newValue) {
        this.#attributeEvents[name] = this.#attributeDescriptorTypeConverter(newValue, type);
        this.addEventListener(name.replace(onRegex, ''), this.#attributeEvents[name]);
      }
    } else {
      this.attributeChangedCallbackExtended(
        name,
        this.#attributeDescriptorTypeConverter(oldValue, type),
        this.#attributeDescriptorTypeConverter(newValue, type)
      );
    }
  }
  attributeChangedCallbackExtended() { }

  connectedCallback() { }
  disconnectedCallback() { }

  render() {
    if (typeof this.template !== 'function') throw Error('Cannot render without a template method');
    if (!this.#prepared) this.#prepareRender();
    if (!this.constructor.useTemplate) this.#templateElement.innerHTML = this.template(); // always re-render
    if (this.constructor.useShadowRoot) this.shadowRoot.replaceChildren(this.#templateElement.content.cloneNode(true));
    else this.replaceChildren(this.#templateElement.content.cloneNode(true));
  }

  /** Handle template once per instance */
  #prepareRender() {
    this.#prepared = true;

    // get or create template element
    let template = templates.get(this.constructor);
    if (!template) {
      template = document.createElement('template');
      templates.set(this.constructor, template);

      // only render once
      if (this.constructor.useTemplate) template.innerHTML = this.template();
    }

    this.#templateElement = template;

    if (this.constructor.useShadowRoot && this.constructor.styleSheets[0] instanceof CSSStyleSheet) {
      this.shadowRoot.adoptedStyleSheets = this.constructor.styleSheets;
    }
  }

  /** Type logic for observedAttributesExtended */
  #attributeDescriptorTypeConverter(value, type) {
    switch (type) {
      case 'boolean':
        return value !== null && `${value}` !== 'false';
      case 'int':
        const int = parseInt(value);
        return isNaN(int) ? '' : int;
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? '' : num;
      case 'string':
        return value || '';
      case 'event':
        return !value ? null : () => new Function('page', value).call(this, this);
      default:
        return value;
    }
  }
}

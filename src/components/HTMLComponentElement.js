import styles from '../styles.css' assert { type: 'css' };
document.adoptedStyleSheets.push(styles);

const policy = trustedTypes.createPolicy('materially', {
  createHTML: (s) => s
});
const dashCaseRegex = /-([a-z])/g;
const camelCaseRegex = /([a-zA-Z])(?=[A-Z])/g;
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
  static get observedAttributes() { return this.observedAttributesExtended.map(a => a[0].replace(camelCaseRegex, '$1-').toLowerCase()); }
  static get _attrs() {
    return Object.fromEntries(this.observedAttributesExtended);
  }

  /**
   * Use with observedAttributesExtended
   *   This automatically handles type conversions and duplicate calls from setting attributes
   * @name observedAttributesExtended
   * @function
   */
  // static get observedAttributesExtended() { }


  #prepared = false;
  #attributeEvents = {};
  #attrConfig;
  #templateElement;


  constructor() {
    super();

    if (this.constructor.useShadowRoot) {
      this.attachShadow({ mode: 'open', delegatesFocus: this.constructor.shadowRootDelegateFocus });
    } else if (this.constructor.styleSheets[0] instanceof CSSStyleSheet) {
      document.adoptedStyleSheets.push(...this.constructor.styleSheets);
    }
  }

  get _attrs() {
    if (!this.#attrConfig) this.#attrConfig = this.constructor._attrs;
    return this.#attrConfig;
  }


  /** Default function used by extended version */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    // placeholders can leak through on initial parse
    // if (oldValue === '{_ex_}') oldValue = '';
    // if (newValue === '{_ex_}') newValue = '';

    name = name.replace(dashCaseRegex, (_, s) => s.toUpperCase());
    const attrType = this._attrs[name];
    if (attrType === 'event') {
      if (this.#attributeEvents.has(name)) {
        this.removeEventListener(name.replace(onRegex, ''), this.#attributeEvents.get(name));
        this.#attributeEvents.delete(name);
      }
      if (newValue) {
        this.#attributeEvents.set(name, this.#attributeDescriptorTypeConverter(newValue, attrType, name));
        this.addEventListener(name.replace(onRegex, ''), this.#attributeEvents.get(name));
      }
    } else {
      this.attributeChangedCallbackExtended(
        name,
        this.#attributeDescriptorTypeConverter(oldValue, attrType, name),
        this.#attributeDescriptorTypeConverter(newValue, attrType, name)
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
      if (this.constructor.useTemplate) template.innerHTML = policy.createHTML(this.template());
    }

    this.#templateElement = template;

    if (this.constructor.useShadowRoot && this.constructor.styleSheets[0] instanceof CSSStyleSheet) {
      this.shadowRoot.adoptedStyleSheets = this.constructor.styleSheets;
    }
  }

  /** Type logic for observedAttributesExtended */
  #attributeDescriptorTypeConverter(value, type, name) {
    switch (type) {
      case 'toggle':
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

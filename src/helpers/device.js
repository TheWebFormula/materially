const mcDevice = new class MCDevice {
  COMPACT = 'compact';
  MEDIUM = 'medium';
  EXPANDED = 'expanded';

  #lastState;
  #state = 'expanded';
  #hasNavigationDrawer = false;
  #hasNavigationRail = false;


  constructor() {
    const compactMediaQuery = window.matchMedia('(width < 600px)');
    const mediumMediaQuery = window.matchMedia('(width >= 600px) and (width < 840px)');
    const expandedMediaQuery = window.matchMedia('(width > 840px)');

    if (compactMediaQuery.matches) this.#state = this.COMPACT;
    else if (mediumMediaQuery.matches) this.#state = this.MEDIUM;
    else this.#state = this.EXPANDED;

    queueMicrotask(() => {
      this.#updateState(this.#state);
    });

    compactMediaQuery.addEventListener('change', event => {
      if (event.matches) this.#updateState(this.COMPACT);
    });

    mediumMediaQuery.addEventListener('change', event => {
      if (event.matches) this.#updateState(this.MEDIUM);
    });

    expandedMediaQuery.addEventListener('change', event => {
      if (event.matches) this.#updateState(this.EXPANDED);
    });

    // if (document.readyState !== 'complete') {
    //   document.addEventListener('DOMContentLoaded', () => {
    //     document.body.classList.add('mc-initiated');
    //   });
    // } else {
    //   window.addEventListener('pageshow', () => {
    //     document.body.classList.add('mc-initiated');
    //   });
    // }
  }

  get state() {
    return this.#state;
  }

  get orientation() {
    // screen.orientation does not work on chrome ios. window.orientation is deprecated but works on chrome ios for now
    if (screen?.orientation ? screen.orientation.type.startsWith('portrait') : Math.abs(window.orientation) !== 90) return 'portrait';
    return 'landscape';
  }

  get hasTouchScreen() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  get hasNavigationDrawer() {
    return this.#hasNavigationDrawer;
  }
  set hasNavigationDrawer(value) {
    this.#hasNavigationDrawer = !!value
  }

  get hasNavigationRail() {
    return this.#hasNavigationRail;
  }
  set hasNavigationRail(value) {
    this.#hasNavigationRail = !!value
  }

  #updateState(state) {
    this.#state = state;
    document.body.classList.remove('window-compact');
    document.body.classList.remove('window-medium');
    document.body.classList.remove('window-expanded');

    switch (state) {
      case 'compact':
        document.body.classList.add('window-compact');
        break;
      case 'medium':
        document.body.classList.add('window-medium');
        break;
      case 'expanded':
        document.body.classList.add('window-expanded');
        break;
    }

    window.dispatchEvent(new CustomEvent('mcwindowstatechange', {
      detail: {
        state,
        lastState: this.#lastState?.state
      }
    }));

    this.#lastState = {
      state
    };
  }
}

window.mcDevice = mcDevice;
export default mcDevice;

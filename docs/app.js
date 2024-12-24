import '@thewebformula/materially';

import './routes/index/index.js';
import './routes/badges/index.js';
import './routes/bottom app bars/index.js';
import './routes/bottom sheets/index.js';
import './routes/buttons/index.js';
import './routes/cards/index.js';
import './routes/carousel/index.js';
import './routes/checkboxes/index.js';
import './routes/chips/index.js';
import './routes/date pickers/index.js';
import './routes/dialogs/index.js';
import './routes/fabs/index.js';
import './routes/forms/index.js';
import './routes/getting started/index.js';
import './routes/icon buttons/index.js';
import './routes/icons/index.js';
import './routes/layout/index.js';
import './routes/lists/index.js';
import './routes/menus/index.js';
import './routes/navigation/index.js';
import './routes/progress indicators/index.js';
import './routes/pull to refresh/index.js';
import './routes/radios/index.js';
import './routes/search/index.js';
import './routes/segmented buttons/index.js';
import './routes/selects/index.js';
import './routes/side sheets/index.js';
import './routes/sliders/index.js';
import './routes/snackbars/index.js';
import './routes/styles/index.js';
import './routes/switches/index.js';
import './routes/tabs/index.js';
import './routes/textfields/index.js';
import './routes/time pickers/index.js';
import './routes/tooltips/index.js';
import './routes/top app bars/index.js';
import './routes/utilities/index.js';

import './code-block.js';



if (typeof hljs === 'undefined') {
  const hljsTag = document.querySelector('#hljsscript');
  hljsTag.onload = () => {
    initHLJS();
  };
} else {
  window.addEventListener('DOMContentLoaded', () => {
    initHLJS();
  });
}

function initHLJS() {
  hljs.configure({ ignoreUnescapedHTML: true, cssSelector: 'code-block pre' });
  hljs.highlightAll();
}

window.addEventListener('load', () => {
  if (location.hash) handleHashAnchor(location.hash, false);
});

window.addEventListener('locationchange', () => {
  hljs.highlightAll();
  if (!location.hash) return;
  handleHashAnchor(location.hash, false);
});


window.addEventListener('hashchange', () => {
  if (!location.hash) return;
  handleHashAnchor(location.hash);
});


function handleHashAnchor(hash, animate = true) {
  try {
    const element = document.querySelector(hash);
    if (element) {
      if (animate) document.documentElement.scroll({ top: element.offsetTop, behavior: 'smooth' });
      else document.documentElement.scroll({ top: element.offsetTop, behavior: 'instant' });
    }
  } catch (e) { console.log('error', e); }
}


window.toggleColorScheme = () => {
  const scheme = mcUtil.toggleColorScheme();
  setTimeout(() => {
    document.querySelectorAll('.theme-toggle').forEach(element => {
      if (scheme === 'dark') element.classList.add('mc-toggled');
      else element.classList.remove('mc-toggled');
    });
  }, 0);
};

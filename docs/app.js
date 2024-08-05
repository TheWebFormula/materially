import '@thewebformula/materially';
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

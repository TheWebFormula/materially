import util from '../../helpers/util.js';

let mouseX;
let mouseY;
let currentElement;
let tooltipTimer;
let globalTooltipElement;
let selectedTooltipElement;
let currentTooltipElement;
let actionElement;
const mousemoveThrottled = util.rafThrottle(mousemove);
function mouseover(event) {
  const hasTarget = event.target.hasAttribute('tooltip-target');
  if (hasTarget) {
    selectedTooltipElement = document.querySelector(`#${event.target.getAttribute('tooltip-target')}`);
    if (!selectedTooltipElement) return;
    currentTooltipElement = selectedTooltipElement;
  }

  if (hasTarget || event.target.hasAttribute('tooltip')) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    currentElement = event.target;
    showTooltip();
    window.addEventListener('mouseover', globalMouseOver);
    window.addEventListener('mousemove', mousemoveThrottled);
  }
}

function showTooltip() {
  if (tooltipTimer) return;

  if (!currentTooltipElement && !globalTooltipElement) createGlobalTooltip();
  currentTooltipElement = selectedTooltipElement || globalTooltipElement;
  
  tooltipTimer = setTimeout(() => {
    if (!selectedTooltipElement) {
      const text = currentElement.getAttribute('tooltip');
      currentTooltipElement.innerHTML = text;
      currentTooltipElement.ariaLabel = text;
    }

    if (currentTooltipElement.hasAttribute('rich')) currentTooltipElement.addEventListener('click', actionClick);
    currentTooltipElement.style.left = `${mouseX}px`;
    currentTooltipElement.classList.add('show');

    let y = mouseY + 18;
    const targetBottom = currentElement.getBoundingClientRect().bottom;
    if (y < targetBottom) y = targetBottom;
    const bottomDiff = (y + currentTooltipElement.height) - (window.innerHeight - 12);
    if (bottomDiff > 0) y -= bottomDiff;
    currentTooltipElement.style.top = `${y}px`;
    actionElement = currentTooltipElement.querySelector('[slot=actions]');
    if (actionElement) {
      window.addEventListener('keydown', captureTab);
    }
  }, 1000);
}

function captureTab(event) {
  if (event.key === 'Tab') {
    actionElement.focus();
    event.preventDefault();
  }
}

function removeTooltip() {
  if (!tooltipTimer) return;
  window.removeEventListener('keydown', captureTab);
  actionElement = undefined;
  currentTooltipElement.classList.remove('show');
  clearTimeout(tooltipTimer);
  tooltipTimer = undefined;
  currentTooltipElement.ariaLabel = '';
  window.removeEventListener('mouseover', globalMouseOver);
  window.removeEventListener('mousemove', mousemoveThrottled);
  if (currentTooltipElement.hasAttribute('rich')) currentTooltipElement.removeEventListener('click', actionClick);
  currentTooltipElement = undefined;
  currentElement = undefined;
  selectedTooltipElement = undefined;
}

function mousemove(event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
}

function globalMouseOver(event) {
  if (currentTooltipElement.contains(event.target)) return;
  if (currentElement.contains(event.target)) return;
  removeTooltip();
}

function createGlobalTooltip() {
  document.body.insertAdjacentHTML('beforeend', /*html*/`
    <mc-tooltip class="global-tooltip"></mc-tooltip>
  `);
  globalTooltipElement = document.querySelector('mc-tooltip.global-tooltip');
}

function actionClick(event) {
  if (event.target.getAttribute('slot') === 'actions') {
    setTimeout(() => {
      removeTooltip();
    }, 150)
  }
}


if (document.readyState !== 'loading') initialize();
else document.addEventListener('DOMContentLoaded', initialize);
function initialize() {
  window.addEventListener('mouseover', mouseover, false);
}

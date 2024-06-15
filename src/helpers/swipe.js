const directions = [
  'right',
  'down',
  'left',
  'up'
];


export default class Swipe {
  #abort;
  #enabled = false;
  #element;
  #horizontalOnly = false;
  #verticalOnly = false;
  #velocityThreshold = 0.3;
  #distanceThreshold = 10;
  #maxTimeMS = 200;
  #start_bound = this.#start.bind(this);
  #end_bound = this.#end.bind(this);

  #startX;
  #startY;
  #startTime;
  #endX;
  #endY;
  #endTime;


  constructor(element, options = {
    horizontalOnly: false,
    verticalOnly: false,
    velocityThreshold: 0.3,
    distanceThreshold: 10,
    maxTimeMS: 200
  }) {
    if (!(element instanceof HTMLElement)) throw Error('HTMLElement required');

    this.#element = element;
    this.#horizontalOnly = !!options.horizontalOnly;
    this.#verticalOnly = !!options.verticalOnly;
    this.#distanceThreshold = options.distanceThreshold || 10;
    this.#velocityThreshold = options.velocityThreshold || 0.3;
    this.#maxTimeMS = options.maxTimeMS || 200;
  }


  enable() {
    if (this.#enabled) return;
    this.#enabled = true;
    this.#abort = new AbortController();

    this.#element.addEventListener('touchstart', this.#start_bound, { signal: this.#abort.signal });
  }

  disable() {
    if (this.#abort) this.#abort.abort();
    this.#enabled = false;
  }

  destroy() {
    this.disable();
    this.#element = undefined;
  }


  #start(event) {
    this.#startX = event.changedTouches[0].screenX;
    this.#startY = event.changedTouches[0].screenY;
    this.#startTime = Date.now();
    this.#element.addEventListener('touchend', this.#end_bound, { signal: this.#abort.signal });
    event.preventDefault();
  }

  #end(event) {
    this.#element.removeEventListener('touchend', this.#end_bound);
    this.#endX = event.changedTouches[0].screenX;
    this.#endY = event.changedTouches[0].screenY;
    this.#endTime = Date.now();
    this.#handleSwipe(event);
  }


  #handleSwipe(event) {
    let time = this.#endTime - this.#startTime;
    if (time > this.#maxTimeMS) return;

    let dx = this.#endX - this.#startX;
    let dy = this.#endY - this.#startY;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < this.#distanceThreshold) return;

    let velocity = distance / time;
    if (Math.abs(velocity) < this.#velocityThreshold) return;

    let radians = Math.atan2(dy, dx);
    let angle = radians * 180 / Math.PI;
    let left = angle >= 135 || angle <= -135;
    let right = angle >= -45 && angle <= 45;
    let up = angle < -45 && angle > -135;
    let down = angle > 45 && angle < 135;

    if (
      (this.#verticalOnly && (left || right))
      || (this.#horizontalOnly && (up || down))
    ) {
      return;
    }

    let direction = left && 'left' || right && 'right' || up && 'up' || down && 'down';
    let swipeEvent = new SwipeEvent(
      event.changedTouches,
      distance,
      direction,
      event.targetTouches,
      event.touches,
      velocity
    );
    this.#element.dispatchEvent(swipeEvent);
  }
}

class SwipeEvent extends TouchEvent {
  constructor(changedTouches, direction, distance, targetTouches, touches, velocity) {
    super('swipe', {
      bubbles: true,
      changedTouches,
      targetTouches,
      touches
    });

    this.direction = direction;
    this.distance = distance;
    this.velocity = velocity;
  }
}
